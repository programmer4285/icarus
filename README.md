# icarus

Build and run:

```zsh
docker build --build-arg ORIGIN=http://localhost:3000 -t icarus .

mkdir -p music
docker run --rm --init -p 3000:3000 \
  -v "$PWD/music:/music" \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=changeme \
  --name icarus \
  icarus
```
