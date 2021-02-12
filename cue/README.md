Quick start

- [Install `cue`](https://cuelang.org/docs/install/)
- Run 
```
cue cmd printCompose katapult.cue katapult_openbalena.cue  katapult/compose.cue input.cue
```

- Try converting NPM package to a keyframe.
```
cue import --force -p katapult --with-context -l '"npmData"' -l 'path.Base(filename)' -l data.name ../package*.json
cue cmd dumpKeyframes katapult*.cue npm-*.cue ../package*.cue
``` 

## Development

[VSCode Extension for the CUE Language](https://github.com/cue-sh/vscode-cue) implements syntax highlighting for the CUE language.

Use `cue eval FILENAME ...` to view the combined output of the filenames listed. For example `cue eval katapult.cue katapult_openbalena.cue` to see how the `katapult.cue` definition combines with the openBalena contract and keyframes. If the output contains typings add the `--concrete` argument to throw an error stating what has not been resolved to concrete values.

Tip: redirect `cue` output to a snapshot file `cue eval katapult.cue katapult_openbalena.cue > snapshot` and then open `snapshot` in your IDE to more effectively inspect the output.
