/*
 * suke
 * (c) 2011-2020 suke
 * https://github.com/sukejs
 * version 0.0.1
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.suke = factory());
}(this, (function () { 'use strict';

	const suke = {};

	return suke;

})));
