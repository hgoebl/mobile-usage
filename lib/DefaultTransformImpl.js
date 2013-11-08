"use strict";

var MobileDetect = require('mobile-detect'),
    versionInfo;

versionInfo = {
    'iPad': Math.floor,
    'iPhone': Math.floor,
    'iPod': Math.floor,
    'iOS': Math.floor,
    'Chrome': Math.floor,
    'Firefox': Math.floor,
    'IE': Math.floor,
    'Webkit': Math.floor,
    'Android': round1,
    'Windows Phone OS': round1,
    'Windows NT': round1,
    'Symbian': Math.floor,
    'Kindle': Math.floor,
    'Blackberry': Math.floor
};

module.exports = function defaultTransformImpl(hit) {
    var md = new MobileDetect(hit.userAgent),
        versions = {},
        formfactor = null,
        desktopBrowser = null;

    Object.keys(versionInfo).forEach(function (key) {
        var version = md.version(key);
        if (version !== null && !isNaN(version)) {
            version = versionInfo[key](Number(version));
            if (version > 0) {
                versions[key] = version;
            }
        }
    });

    if (md.phone()) {
        formfactor = md.tablet() ? 'Phone/Tablet' : 'Phone';
    } else if (md.tablet()) {
        formfactor = 'Tablet';
    } else if (md.is('Bot') || md.is('MobileBot')) {
        formfactor = 'Bot';
    } else if (md.is('TV') || md.is('Console')) {
        formfactor = 'TV/Console';
    } else {
        formfactor = null;
        desktopBrowser = checkVersion(md, 'Firefox') || checkVersion(md, 'IE') ||
            checkVersion(md, 'Chrome') || checkVersion(md, 'Opera') || checkVersion(md, 'Safari') ||
            '(unknown)';
    }

    // if (desktopBrowser==='(unknown)') console.log(hit.userAgent);
    // console.log(md.mobileGrade() + ' ' + hit.userAgent);

    return {
        os: md.os(),
        phone: md.phone(),
        tablet: md.tablet(),
        mobileGrade: md.mobile() && md.mobileGrade(),
        mobileGradeAll: md.mobileGrade(),
        userAgent: md.userAgent(),
        formfactor: formfactor,
        desktopBrowser: desktopBrowser,
        versions: versions
    };
};

function checkVersion(md, versionKey) {
    var version = md.version(versionKey);

    return (version !== null && !isNaN(version)) ? versionKey : false;
}

function round1(version) {
    var versionStr = '' + Math.floor(Number(version) * 10) / 10;
    if (versionStr.indexOf('.') < 0) {
        versionStr += '.0';
    }
    return versionStr;
}
