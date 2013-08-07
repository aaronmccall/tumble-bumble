var async = require('async'),
    fs = require('fs'),
    sugar = require('sugar'),
    path = require('path'),
    EventEmitter = require('events').EventEmitter,
    parsers = require('./parsers.js'),
    postFileTemplate = function (post) { return Date.create(post.date).format('{yyyy}-{MM}-{dd}') + '-' + post.slug + '.md'; },
    default_options = {
        // Default options go here
    };
function eachKey(obj, fn) {
    var key, val;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            val = obj[key];
            fn(val, key, obj);
        }
    }
}

function Parser(options) {
    EventEmitter.call(this);
    this._posts = [];
    this.initOptions(options);
}
Parser.prototype = Object.create(EventEmitter.prototype);
Parser.prototype.constructor = Parser;

// Add the rest of our methods to Parser's prototype
(function () {

    this.initOptions = function (options) {
        var key,
            setOption = function (val, option) {
                this.options[option]  = val;
            }.bind(this);
        this.options = {};
        eachKey(default_options, setOption);
        eachKey(options, setOption);
    };

    this.parse = function (posts, done) {
        var self = this;
        if (!posts || !posts.length) return done();
        async.each(posts, function (post, cb) {
            var parser = parsers[post.type];
            if (!parser) return console.warn('no parser available for ' + post.slug + ' (' + post.type + ')'), cb();
            parser(post, function (err, post) {
                if (err) return console.error(err);
                self.addPost(post);
                cb();
            });
        }, function () { done(); });
    };

    this.addPost = function (post_data) {
        var post = new Post(post_data);
        this._posts.push(post);
        this.emit('post_added', post, post.getFileName());
    };

    this.getPost = function (post_id) {
        // return by post.filename match
        if (typeof post_id === 'string') {
            for (var post, i = this._posts.length; --i;) {
                post = this._posts[i];
                if (post.filename === post_id) return post;
            }
        }
        // return by index in _posts
        if (typeof post_id === 'number') {
            return this._posts[post_id] || null;
        }

        return null;
    };

}).call(Parser.prototype);

function Post(data) {
    eachKey(data, function (val, key) {
        this[key] = val;
    }.bind(this));
}

(function () {

    this.getFileName = function () {
        this.filename = this.filename || postFileTemplate(this);
        return this.filename;
    };

    this.getMetaText = function () {
        if (this.metaText) return this.metaText;
        var metaText = '';
        eachKey(this.meta, function (item, key) {
            metaText += '#' + key + ': ' + item + '\n';
        });
        this.metaText = metaText;
        return metaText;
    };

    this.getBumbleText = function () {
        return this.getMetaText() + '\n' + (this.body||'');
    };

    this.getImageFileName = function () {
        if (this.type === 'photo') return this.meta.original_photo_url.split('/').pop();
    };

}).call(Post.prototype);

module.exports = Parser;