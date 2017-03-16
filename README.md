Lithp-Web IDE 2
===============

A more fully-featured web IDE than the [previous attempt](https://andrakis.github.io/lithp-webide/) which
aims to provide a fully functional browser based IDE for Lithp, utilizing the ACE editor.

One may run Lithp code directly from the browser, and can also explore the many sample files and run them.

The toolbar provides the Debug Mode functionality, allowing one to see what the interpreter is running underneath the hood.

Where can I try it?
-------------------

A stable yet in-development build is always available at [https://andrakis.github.io/ide2/](https://andrakis.github.io/ide2/).

Implemented features - version 0.5.2
------------------------------------

* Core ACE editor implemented (sidebar not yet functional)

* Packaged files available in a file list (samples, core Lithp source code)

* A permalink to the changes to "unnamed.lithp" is available on the toolbar

* One can modify Lithp modules and sample code, and run their changes. Note that changes to modules are not yet reflected when importing

* A messaging system decouples the UI handling from the Lithp runtime


Remaining features for version 1.0
----------------------------------

* Implement editor sidebar functionality

* Browser-side file caching (ie, persist all changes to browser storage)

* Project functionality

* Server-side code storage (some files are too large for the permalink system)

Requirements
------------

* A web server that can serve static files.

Building
--------

Web IDE usually ships with the latest compiled version. However, if you want to compile it yourself, follow
these steps:

1. Ensure make is installed

2. Run: npm install

3. Run: make

4. Copy files from `html` to destination folder.

Lithp?
------

[Lithp](https://github.com/andrakis/node-lithp) is a personal Lisp-inspired programming language.
