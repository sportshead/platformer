# platformer
This is a small platformer game that I made around August 2020. This project utilizes the [Closure Compiler](https://developers.google.com/closure/compiler/) for performance and optimization. This is the first HTML5 game I have made from scratch.

## Usage
Compile using `./compile.sh`. Requires Java. Everything in public/ are symlinks, so no need to edit them. For development, open `./index.html`. For production, use the `public` folder.

`linesplitter` is a small NodeJS program used to split cutscene text in half. Call it like this: `./linesplitter The quick brown fox jumped over sixteen lazy dogs.` It will output the original string, but with the middle-most space replaced with a `\n`.
