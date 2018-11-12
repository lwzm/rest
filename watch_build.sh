while true; do
    inotifywait -e modify definitions.js postgrest.js
    date
    yarn build
done
