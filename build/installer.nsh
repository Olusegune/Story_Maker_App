!macro customInstall
  ; Repair shortcuts left behind by the legacy 0.1.x per-user launcher.
  ; The current installer must always point to the executable it just installed.
  Delete "$DESKTOP\Wheelbarrow Studios Story Maker.lnk"
  Delete "$SMPROGRAMS\Wheelbarrow Studios Story Maker.lnk"
  Delete "$SMPROGRAMS\Wheelbarrow Studios Story Maker\Wheelbarrow Studios Story Maker.lnk"
  ; Remove the legacy launcher that could be opened independently of the install.
  Delete "$LOCALAPPDATA\Wheelbarrow Studios Story Maker\wheelbarrow-storymaker.exe"
  RMDir "$LOCALAPPDATA\Wheelbarrow Studios Story Maker"
  CreateDirectory "$SMPROGRAMS\Wheelbarrow Studios Story Maker"
  CreateShortCut "$DESKTOP\Wheelbarrow Studios Story Maker.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  CreateShortCut "$SMPROGRAMS\Wheelbarrow Studios Story Maker\Wheelbarrow Studios Story Maker.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
!macroend
