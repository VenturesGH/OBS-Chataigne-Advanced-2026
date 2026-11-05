# Optional request fields

Generated actions use the optional/required metadata embedded from the official OBS WebSocket 5.x protocol. Unset optional strings, `undefined`, and `null` values are omitted from `requestData`; explicit values such as `0`, `-1`, `false`, `[]`, and `{}` are preserved. Required fields are never silently removed. Protocol-defined nullable fields, such as the transition fields used to remove a scene transition override, accept the text `null` and convert it to JSON null.

Newly generated actions store that metadata in their hidden `fieldList`. `optionalRequestFields` is the protocol-derived compatibility index for existing Chataigne actions whose saved `fieldList` predates this metadata.

Optional Number fields are generated as Chataigne String parameters with an empty default. This is intentional: Chataigne's numeric default `0` is a valid OBS value and cannot represent “not supplied.” A non-empty value is validated and converted back to a JSON number before transmission.

Optional Boolean fields retain a checkbox. The generator uses the documented OBS default and omits that value; choosing the opposite value sends it explicitly.

`OpenSourceProjector` and `OpenVideoMixProjector` enforce the protocol's mutual exclusion between `monitorIndex` and `projectorGeometry`. When geometry is supplied it takes precedence over an old Chataigne action's default monitor index. New actions leave the optional monitor text blank.

`OpenSourceProjector` validates OBS's conditional requirement that at least one of `sourceName` and `sourceUuid` is filled. The same validation applies to all generated input/name, scene/name and source/name identifier pairs. An invalid action is logged and not transmitted. The serializer accepts the optional `canvasUuid` introduced by OBS WebSocket 5.7.

## GetMonitorList summary

The normal `GetMonitorList` response remains available under `Responses`. It now also exposes `monitorCount`. All valid monitor indexes are sorted by `monitorPositionX` and published under `Merged > Monitoren`. When OBS reports exactly three monitors, the aliases `Links`, `Midden`, and `Rechts` are added.

Optional strings that are explicitly allowed to be empty must be listed in `optionalEmptyStringFields` in `OBSAdvanced.js`, or set `allowEmptyString: true` in a field's optional `fieldList` metadata.
