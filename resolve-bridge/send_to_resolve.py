"""
Storymaker -> DaVinci Resolve bridge.

Talks to Resolve's official scripting API (Studio-only — the free edition
does not expose it). This process is spawned fresh per click from
electron-main.js, with RESOLVE_SCRIPT_API / RESOLVE_SCRIPT_LIB / PYTHONPATH
set on its own environment only, never the user's system-wide profile.

Request (JSON on stdin) is one of two shapes:
  Single shot (per-shot "Send to Resolve" button):
    {"filePath": str, "binName": str, "appendToTimeline": bool, "duration": float|null}
  Whole edit, in order (bulk "Send entire edit to Resolve" button):
    {"clips": [{"filePath": str, "duration": float|null}, ...], "binName": str, "appendToTimeline": bool}
  The key present picks the mode — "clips" (a list) always means bulk,
  "filePath" (a single string) always means single-shot. "duration" (in
  seconds), when present, marks the clip's timeline length via Mark
  In/Out — for a still, that's the shot's planned hold time; for a real
  video clip it means Storymaker deliberately wants it held/trimmed to
  that length (Music Video mode, a section-timed clip). Omit it, or send
  null, to let a video clip play its own actual length instead.

Response (one line of JSON on stdout) is one of three shapes:
  Single shot: {"ok": true, "binName", "projectName", "alreadyInBin",
                "appendedToTimeline", "note"}
  Bulk edit:   {"ok": true, "binName", "projectName", "total", "imported",
                "reused", "skipped", "appendedToTimeline", "appendedCount",
                "note"}
  Either mode on failure: {"ok": false, "message": str}

Always exits 0 with a JSON "ok": false on a handled failure (Resolve not
running, no project open, file missing, etc.) — a non-zero exit or
unparseable stdout means something actually crashed, which the caller
treats differently (falls back to stderr for that case).
"""
import sys
import os
import json


def emit(result):
    print(json.dumps(result))
    sys.stdout.flush()


def fail(message):
    emit({"ok": False, "message": message})
    sys.exit(0)


def coerce_duration(value):
    """None/absent, 0, or anything non-numeric all mean "no override, play
    this clip's own natural length" — only a genuine positive number of
    seconds requests a still hold."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)) and value > 0:
        return float(value)
    return None


def frames_for_duration(duration_seconds, frame_rate):
    return max(1, round(duration_seconds * frame_rate))


def resolve_item(media_pool, file_path, existing_by_path):
    """Resolves file_path to a single Resolve media pool item, importing
    only if nothing exists yet at this path in this bin. Returns (item,
    was_already_present).

    Confirmed live: Resolve's own ImportMedia coalesces repeated imports
    of the same file path within one folder into the SAME MediaPoolItem —
    it does not create independent copies, even across separate calls in
    this same script run. So there is only ever ONE bin item per unique
    file path; a still's on-timeline duration has to be applied per
    occurrence, immediately before each individual append (see
    append_one() below), not baked into the item itself."""
    key = os.path.normcase(os.path.normpath(file_path))
    cached = existing_by_path.get(key)
    if cached:
        return cached, True
    # The list-import method some community docs describe actually lives
    # on MediaStorage, not this object (confirmed live via
    # dir(media_pool), which does not list it). MediaPool's real import
    # method for arbitrary file paths is ImportMedia(filePaths).
    added = media_pool.ImportMedia([file_path]) or []
    item = added[0] if added else None
    if item:
        existing_by_path[key] = item
    return item, False


def append_one(media_pool, item, duration, frame_rate):
    """Appends a single item to the current timeline, marking it to the
    given duration (seconds) first, if one was sent — for a still, that's
    always its planned hold time; for a real video clip it means the
    caller (Storymaker) deliberately wants this occurrence held/trimmed to
    that length rather than playing its own actual length (Music Video
    mode's "hold/trim a clip to its song section" behavior).

    This has to happen immediately before its OWN append, one clip at a
    time — not batched by marking several items and appending them all in
    one AppendToTimeline(list) call at the end. Confirmed live: the same
    still used by three shots at three different planned durations only
    landed all three on the timeline at whatever duration was marked
    LAST, because Mark In/Out is one shared, mutable property on the one
    real MediaPoolItem (see resolve_item() above) — a batched multi-item
    append reads that one shared mark once, for the whole call. Marking
    right before each individual append instead "freezes" that duration
    for that occurrence's own timeline placement: an already-placed
    timeline item does NOT change when the source item's mark is changed
    again afterward — confirmed live the same way, an earlier placed item
    stayed at its original duration through several later mark changes to
    the same underlying media pool item.

    Also confirmed live that Resolve's OTHER two documented ways to
    control a clip's appended length — AppendToTimeline([{clipInfo}])'s
    startFrame/endFrame, and MediaPoolItem.SetClipProperty("Duration",
    ...) — are BOTH silently ignored for a still image; only Mark In/Out
    actually works, the same mechanism the Resolve UI itself uses when
    you mark a range in the bin before editing it in.

    Sequential single-item appends still produce correct back-to-back
    sequential placement overall, same as one batched call would have:
    AppendToTimeline always adds after whatever is currently the last
    item on the timeline, whether called once with a list or several
    times in a row with one item each."""
    if duration is not None:
        item.SetMarkInOut(0, frames_for_duration(duration, frame_rate) - 1, "all")
    return bool(media_pool.AppendToTimeline([item]))


def main():
    try:
        # Node's side never writes a BOM (JSON.stringify/stdin.write don't
        # produce one) — this strip is defensive only, for whatever else
        # might end up invoking this script the same way over stdin.
        payload = json.loads((sys.stdin.read() or "{}").lstrip("﻿"))
    except Exception as error:
        fail(f"Could not read the request from Storymaker: {error}")
        return

    bulk_mode = isinstance(payload.get("clips"), list)
    bin_name = (payload.get("binName") or "Storymaker").strip() or "Storymaker"
    append_to_timeline = bool(payload.get("appendToTimeline", True))

    if bulk_mode:
        requested_clips = [
            {"filePath": str(c.get("filePath", "")), "duration": coerce_duration(c.get("duration"))}
            for c in payload.get("clips")
            if isinstance(c, dict) and str(c.get("filePath") or "").strip()
        ]
        if not requested_clips:
            fail("There's nothing approved yet to send — approve or attach at least one shot's output first.")
            return
        clips = [c for c in requested_clips if os.path.isfile(c["filePath"])]
        skipped = [c["filePath"] for c in requested_clips if not os.path.isfile(c["filePath"])]
        if not clips:
            fail("None of this edit's output files could be found on disk.")
            return
    else:
        file_path = payload.get("filePath", "")
        duration = coerce_duration(payload.get("duration"))
        if not file_path or not os.path.isfile(file_path):
            fail("That shot's output file could not be found on disk.")
            return

    try:
        import DaVinciResolveScript as dvr  # noqa: N813 — this is the module's real name
    except Exception as error:
        fail(f"Could not load DaVinci Resolve's scripting module: {error}")
        return

    resolve = dvr.scriptapp("Resolve")
    if not resolve:
        fail("DaVinci Resolve is not running, or its scripting API is unavailable. Open DaVinci Resolve Studio and try again.")
        return

    # GetCurrentProject() can return an object even while Resolve is still
    # sitting at the Project Manager / database picker screen — confirmed
    # live: it reported an "Untitled Project" in that exact state, but
    # every Media Pool write (ImportMedia, AddSubFolder) silently returned
    # None regardless of arguments, while every read (GetRootFolder,
    # GetName, GetClipList) worked fine. GetCurrentPage() is what actually
    # distinguishes the two: it's None until a project has genuinely been
    # opened into the main workspace, so that's the real gate, not project
    # existence.
    project_manager = resolve.GetProjectManager()
    project = project_manager.GetCurrentProject() if project_manager else None
    if not project or not resolve.GetCurrentPage():
        fail("DaVinci Resolve is open, but no project is loaded into the workspace yet — it looks like it's still on the Project Manager screen. Open or create a project inside Resolve, then try again.")
        return

    media_pool = project.GetMediaPool()
    if not media_pool:
        fail("Could not reach DaVinci Resolve's Media Pool.")
        return

    # Needed to convert a still's planned duration (seconds) into the exact
    # frame count SetMarkInOut() expects. project.GetSetting() always
    # returns a string; default to 24 (this app's own timebase, matching
    # the FCPXML export) if it's ever missing or unparseable.
    try:
        frame_rate = float(project.GetSetting("timelineFrameRate") or 24)
    except (TypeError, ValueError):
        frame_rate = 24.0

    root_folder = media_pool.GetRootFolder()
    target_folder = None
    for folder in (root_folder.GetSubFolderList() or []):
        if folder.GetName() == bin_name:
            target_folder = folder
            break
    if not target_folder:
        target_folder = media_pool.AddSubFolder(root_folder, bin_name)
    if not target_folder:
        fail(f"Could not create or find the '{bin_name}' bin in Resolve's Media Pool.")
        return

    media_pool.SetCurrentFolder(target_folder)

    # Clicking this twice on the same shot (or sending the whole edit after
    # already sending a shot or two individually) must not scatter
    # duplicate media items across the bin — index what's already sitting
    # in this folder by file path once, up front, and reuse it below
    # rather than importing again.
    existing_by_path = {}
    for item in (target_folder.GetClipList() or []):
        props = item.GetClipProperty() or {}
        existing_path = props.get("File Path", "")
        if existing_path:
            existing_by_path[os.path.normcase(os.path.normpath(existing_path))] = item

    if not bulk_mode:
        target_item, already_present = resolve_item(media_pool, file_path, existing_by_path)
        if not target_item:
            fail("Resolve accepted the request but did not return a media pool item for this file.")
            return

        appended = False
        note = ""
        if append_to_timeline:
            timeline = project.GetCurrentTimeline()
            if timeline:
                appended = append_one(media_pool, target_item, duration, frame_rate)
                if not appended:
                    note = "Added to the bin, but Resolve could not append it to the current timeline."
            else:
                note = "Added to the bin. No timeline is open in Resolve yet, so nothing was appended to an editor — open or create one, then send this shot again."

        emit({
            "ok": True,
            "binName": bin_name,
            "projectName": project.GetName() if hasattr(project, "GetName") else "",
            "alreadyInBin": already_present,
            "appendedToTimeline": appended,
            "note": note
        })
        return

    # Bulk mode: resolve every file to a media pool item, appending each
    # ONE AT A TIME, immediately, in the exact order given
    # (visualPreviewEntries() on the Node side already put them in real
    # scene/shot order). Sequential single-item appends still land
    # correctly back-to-back — AppendToTimeline always adds after whatever
    # is currently the timeline's last item, whether called once with a
    # list or several times in a row — and, unlike one batched call at the
    # end, marking-then-appending each clip individually is what lets the
    # SAME still be held for a DIFFERENT duration on each of several shots
    # that share it (see append_one()'s docstring for why that matters:
    # there is only ever one real MediaPoolItem per file path, so its Mark
    # In/Out has to be set and used immediately, per occurrence).
    imported_count = 0
    reused_count = 0
    appended_count = 0
    timeline = project.GetCurrentTimeline() if append_to_timeline else None
    note = ""
    if append_to_timeline and not timeline:
        note = "Added to the bin. No timeline is open in Resolve yet, so nothing was appended to an editor — open or create one, then send the edit again."

    for clip in clips:
        item, was_present = resolve_item(media_pool, clip["filePath"], existing_by_path)
        if not item:
            skipped.append(clip["filePath"])
            continue
        if was_present:
            reused_count += 1
        else:
            imported_count += 1
        if timeline:
            if append_one(media_pool, item, clip["duration"], frame_rate):
                appended_count += 1

    if imported_count + reused_count == 0:
        fail("Resolve accepted the request but did not return media pool items for this edit's files.")
        return

    appended = appended_count > 0
    if append_to_timeline and timeline and appended_count < (imported_count + reused_count):
        note = f"{note} Added everything to the bin, but Resolve could not append every clip to the current timeline.".strip()
    if skipped:
        skip_note = f"{len(skipped)} shot{'s' if len(skipped) != 1 else ''} had no output file on disk and {'were' if len(skipped) != 1 else 'was'} skipped."
        note = f"{note} {skip_note}".strip()

    emit({
        "ok": True,
        "binName": bin_name,
        "projectName": project.GetName() if hasattr(project, "GetName") else "",
        "total": len(requested_clips),
        "imported": imported_count,
        "reused": reused_count,
        "skipped": skipped,
        "appendedToTimeline": appended,
        "appendedCount": appended_count,
        "note": note
    })


if __name__ == "__main__":
    main()
