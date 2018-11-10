while true; do
    inotifywait -e modify definitions.js postgrest.js
    yarn build
done
