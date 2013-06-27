var toMarkdown = require('html-md'),
	_ = require('underscore'),
	fs = require('fs'),
	sugar = require('sugar'),
	path = require('path'),
	meta_keys = [
		'date',
		'slug',
		['post_url', null, 'tumblr_post_url'],
		['tags', function (tags) { return tags.join(', '); }],
		'title',
		'type'
	],
	postFileTemplate = _.template('<%= date %>-<%= slug %>.md');

exports.parse = function (posts, outDir, cb) {
	_.each(posts, function (post) {
		var final_post = '', post_file;
		_.each(meta_keys, function (key) {
			var transform, val, newkey;
			if (_.isArray(key)) {
				transform = key[1];
				if (key.length == 3) newkey = key[2];
				key = key[0];
			}
			val = post[key];
			if (val) final_post += '#' + (newkey || key) + ': ' + (transform ? transform(val) : val) + '\n';
		});
		final_post += '\n';
		final_post += toMarkdown(post.body);
		post_file = postFileTemplate({
			slug: post.slug,
			date: Date.create(post.date).format('{yyyy}-{MM}-{dd}')
		});
		console.log('generated ' + post_file);
		fs.writeFileSync(path.join(outDir, post_file), final_post);
	});
	cb();
};