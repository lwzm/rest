while true; do
    inotifywait -e modify definitions.js
    yarn build
done
