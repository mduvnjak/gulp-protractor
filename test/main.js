/*global describe, it*/
'use strict';

var fs = require('fs'),
	es = require('event-stream'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	path = require('path');

require('mocha');

var Vinyl = require('vinyl'),
	protractor = require('../').protractor,
	webdriver = require('../').webdriver,
	getProtractorDir = require('../').getProtractorDir,
	getProtractorCli = require('../').getProtractorCli,
	child_process = require('child_process'),
	events = require('events');

var winExt = /^win/.test(process.platform) ? '.cmd' : '';


describe('gulp-protractor: getProtractorDir', function() {

	it('should find the protractor installation', function(done) {
		expect(getProtractorDir()).to.equal(path.resolve('./node_modules/.bin'));
		done();
	});
});

describe('gulp-protractor: getProtractorCli', function() {

	it('should find the protractor cli.js', function(done) {
		expect(getProtractorCli()).to.equal(path.resolve('./node_modules/protractor/built/cli.js'));
		done();
	});
});

describe('gulp-protractor: protractor', function() {

	it('should pass in the args into the protractor call', function(done) {
		var fakeProcess = new events.EventEmitter();
		var spy = sinon.stub(child_process, 'fork', function(cmd, args, options) {

			expect(path.basename(cmd)).to.equal('cli.js');
			expect(path.basename(args[0])).to.equal('protractor.config.js');
			expect(args[1]).to.equal('--browser');
			expect(args[2]).to.equal('Chrome');
			expect(args[3]).to.equal('--chrome-only');
			child_process.fork.restore();
			done();

			return new events.EventEmitter();
		});
		var srcFile = new Vinyl({
			path: 'test/fixtures/test.js',
			cwd: 'test/',
			base: 'test/fixtures',
			contents: null
		});

		var stream = protractor({
			configFile: 'test/fixtures/protractor.config.js',
			args: [
				'--browser', 'Chrome',
				'--chrome-only'
			]
		});

		stream.write(srcFile);
		stream.end();
	});

	it('should pass the test-files to protractor via arg', function(done) {
		var fakeProcess = new events.EventEmitter();
		var spy = sinon.stub(child_process, 'fork', function(cmd, args, options) {

			expect(path.basename(cmd)).to.equal('cli.js');
			expect(path.basename(args[0])).to.equal('protractor.config.js');
			expect(args[1]).to.equal('--specs');
			expect(args[2]).to.equal(path.join('test', 'fixtures', 'test.js'));

			child_process.fork.restore();
			done();

			return new events.EventEmitter();
		});

		var srcFile = new Vinyl({
			path: 'test/fixtures/test.js',
			cwd: 'test/',
			base: 'test/fixtures',
			contents: null
		});

		var stream = protractor({
			configFile: 'test/fixtures/protractor.config.js'
		});

		stream.write(srcFile);
		stream.end();

	});

	it('shouldnt pass the test-files to protractor if there are none', function(done) {
		var spy = sinon.stub(child_process, 'fork', function(cmd, args, options) {

			expect(path.basename(cmd)).to.equal('cli.js');
			expect(path.basename(args[0])).to.equal('protractor.config.js');
			expect(args[1]).to.be(undefined);
			expect(args[2]).to.be(undefined);

			child_process.fork.restore();
			done();

			return new events.EventEmitter();
		});

		var srcFile = new Vinyl({
			path: 'test/fixtures/test.js',
			cwd: 'test/',
			base: 'test/fixtures',
			contents: null
		});

		var stream = protractor({
			configFile: 'test/fixtures/protractor.config.js'
		});

		stream.end();

	});

	it('should propagate protractor exit code', function(done) {
		var fakeProcess = new events.EventEmitter();
		var spy = sinon.stub(child_process, 'fork', function(cmd, args, options) {
			child_process.fork.restore();
			process.nextTick(function() { fakeProcess.emit('exit', 255) });
			fakeProcess.kill = function() { };
			return fakeProcess;
		});

		var srcFile = new Vinyl({
			path: 'test/fixtures/test.js',
			cwd: 'test/',
			base: 'test/fixtures',
			contents: null
		});

		var stream = protractor({
			configFile: 'test/fixtures/protractor.config.js'
		});

		stream.write(srcFile);
		stream.end();
		stream.on('error', function(err) {
			done();
		});
	});

	it('should emit an error on code null (Out Of Memory)', function(done) {
		var fakeProcess = new events.EventEmitter();
		var spy = sinon.stub(child_process, 'fork', function(cmd, args, options) {
			child_process.fork.restore();
			process.nextTick(function() { fakeProcess.emit('exit', null, 'SIGABRT') });
			fakeProcess.kill = function() { };
			return fakeProcess;
		});

		var srcFile = new Vinyl({
			path: 'test/fixtures/test.js',
			cwd: 'test/',
			base: 'test/fixtures',
			contents: null
		});

		var stream = protractor({
			configFile: 'test/fixtures/protractor.config.js'
		});

		stream.write(srcFile);
		stream.end();
		stream.on('error', function(err) {
			done();
		});
	});
});


describe('gulp-protractor: webdriver', function() {

	it.skip('should call update and then start on the webdriver-manager', function(done) {

		var fakeProcess = new events.EventEmitter();
		var seconds_call = false;
		var spy = sinon.stub(child_process, 'spawn', function(cmd, args, options) {
			expect(path.basename(cmd)).to.equal('webdriver-manager' + winExt);
			if (!seconds_call) {
				expect(args[0]).to.equal('update');
			} else {
				expect(args[0]).to.equal('start');
				child_process.spawn.restore();
				done();
			}
			return fakeProcess;
		});

		var wd = webdriver();
		setTimeout(function() {
			seconds_call = true;
			fakeProcess.emit('close');
		}, 100);


	});
});
