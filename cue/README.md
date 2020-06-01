Quick start

- [Install `cue`](https://cuelang.org/docs/install/)
- Run 
```
cue cmd dumpContracts katapult*.cue examples.cue
cue cmd dumpK8s katapult*.cue examples.cue
```

- Try converting NPM package to a keyframe.
```
cue import --force -p katapult --with-context -l '"npmData"' -l 'path.Base(filename)' -l data.name ../package*.json
cue cmd dumpKeyframes katapult*.cue npm-*.cue ../package*.cue
``` 
