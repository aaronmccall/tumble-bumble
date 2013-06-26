var toMarkdown = require('html-md'),
	_ = require('underscore'),
	fs = require('fs'),
	sugar = require('sugar'),
	meta_keys = [
		'title',
		'slug',
		'date',
		['tags', function (tags) { return tags.join(', '); }],
		'type'
	],
	postFileTemplate = _.template('<%= outDir %><%= date %>-<%= slug %>.md');

module.exports = function (posts, outDir) {
	_.each(posts, function (post) {
		var final_post = '', post_file;
		_.each(meta_keys, function (key) {
			var transform, val;
			if (_.isArray(key)) {
				transform = key[1];
				key = key[0];
			}
			val = post[key];
			if (val) final_post += '#' + key + ': ' + (transform ? transform(val) : val) + '\n';
		});
		final_post += '\n';
		final_post += toMarkdown(post.body);
		post_file = postFileTemplate({
			outDir: outDir,
			slug: post.slug,
			date: Date.create(post.date).format('{yyyy}-{MM}-{dd}')
		});
		console.log('generated ' + post_file);
		fs.writeFileSync(post_file, final_post);
	});
};