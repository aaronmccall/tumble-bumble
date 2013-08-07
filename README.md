# tumble-bumble

A tool to migrate your tumblr posts to bumble-friendly markdown files. You run it from the root of your bumble app like so:
```
	Usage: node ./bin/tumble-bumble [tumblr name | URL]

	Options:
	  --limit, -l             The maximum number of posts to retrieve                  [default: "all"]
	  --output_directory, -o  The output directory for posts. (Must already exist)     [default: "blog"]
	  --download_images, -i   Download images from photo posts                         [default: false]
	  --image_path, -I        The output directory for images. (Must already exist)    [default: "public/images"]
	  --type, -t              The type of posts for which you want to generate files.  [default: ""]
  ```

## post type support

* text
* chat: 
  Renders chat session as a list (`<ul>`) of messages (`<li>`). Each message is also a list (`<ul>`) of one (message only) or two (author and message) items (`<li>`).
* link
* quote
* photo _(only one photo per post currently)_
* audio
* video

## to-do
