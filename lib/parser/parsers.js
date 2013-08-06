var toMarkdown = require('html-md'),
    oembed = require('oembed'),
    md = function (html) {
        return toMarkdown(html, { inline: true });
    },
    embed = function (url, cb) {
        if (!url) return cb('no url provided');
        oembed.fetch(url, {}, cb);
    },
    _ = require('underscore'),
    meta_keys = {
    all:    [
        'date',
        'slug',
        ['post_url', null, 'tumblr_post_url'],
        ['tags', function (tags) { return tags.join(','); }],
        ['title', smart_truncate],
        'type'
    ],
    text:   [],
    photo:  [
        ['photos', function (photos) {
            return _.map(photos, function (photo) { return photo.original_size.url; }).join(',');
        }, 'original_photo_url'],
        ['photos', function (photos) {
            return _.map(photos, function (photo) {
                return _.findWhere(photo.alt_sizes, { width: 75, height: 75 }).url;
            }).join(',');
        }, 'thumbnail'],
        ['caption', md]
    ],
    quote:  [
        ['text', md, 'quote'],
        ['source', md]
    ],
    link:   [
        ['description', md],
        ['url', null, 'original'],
        ['source_url', null, 'original']
    ],
    chat:   ['dialogue'],
    audio:  [
        ['source_url', null, 'media_url'],
        ['caption', md]
    ],
    video:  [
        ['permalink_url', null, 'media_url'],
        ['caption', md]
    ],
    answer: []
}, _final_meta = {};
var parsers = module.exports = {};

function extract_meta(post, type) {
    var meta = {},
        final_meta = _final_meta[type] || (_final_meta[type] = meta_keys.all.concat(meta_keys[type]||[]));
    _.each(final_meta, function (key) {
        var transform, val, newkey;
        if (_.isArray(key)) {
            transform = key[1];
            if (key.length == 3) newkey = key[2];
            key = key[0];
        }
        val = post[key];
        if (val !== undefined) meta[(newkey || key)] = (transform ? transform(val) : val);
    });
    return meta;
}

function smart_truncate(string) {
    var needs_shortened = string.match(/^[^\n\.\?\!]+([\n\.\?\!])/);
    if (needs_shortened) return needs_shortened[0].trim();
    return string;
}

// All parser function should accept the post object and modify it as needed
function oembed_handler(post, handler) {
    embed(post.meta.media_url, function (err, res) {
        if (err) return handler(err);
        if (res.thumbnail_url) post.meta.thumbnail = res.thumbnail_url;
        var title = (res.title||''),
            link_content = res.thumbnail_url ? "![" + title + "](" + res.thumbnail_url + ")" : title,
            media_link = "[" + link_content + "](" + post.meta.media_url + ")";
        post.meta.media_link = media_link;
        if (res.html) {
            post.body = res.html;
        } else {
            post.body = media_link;
        }
        if (!post.meta.title) post.meta.title = smart_truncate(title);
        if (post.meta.caption) {
            post.body += "\n\n" + post.meta.caption;
            if (!post.meta.title) post.meta.title = smart_truncate(post.meta.caption);
            delete post.meta.caption;
        }
        handler(null, post);
    });
}

parsers.audio = oembed_handler;

parsers.video = oembed_handler;

parsers.chat = function (post) {
    post.body = "- " + _.map(post.meta.dialogue, function (msg) {
        var prefix = "\n    - ",
            message = [];
        if (msg.name.trim().length) message.push(msg.name.trim());
        if (msg.phrase.trim().length) message.push(msg.phrase.trim());
        return prefix + message.join(prefix);
    }).join("\n- ");
    delete post.meta.dialogue;
};

parsers.link = function (post) {
    post.body = post.meta.description;
    delete post.meta.description;
};

parsers.photo = function (post) {
    post.body = "![" + (post.meta.slug||'') + "](" + post.meta.original_photo_url + ")";
    if (post.meta.caption) {
        post.body += '\n' + post.meta.caption;
        if (!post.meta.title) post.meta.title = smart_truncate(post.meta.caption);
        delete post.meta.caption;
    }
};

parsers.quote = function (post) {
    post.body = "> " + post.meta.quote.split("\n").join("\n> ");
    delete post.meta.quote;
    post.body += '\n' + post.source;
};

parsers.text = function (post) {
    post.body = post.format === 'html' ? md(post.body) : post.body;
};

_.each(parsers, function (fn, name) {
    parsers[name] = function (post, handler) {
        post.meta = extract_meta(post, post.type);
        if (fn.length === 1) {
            fn(post);
            handler(null, post);
        } else {
            fn(post, handler);
        }
    };
});