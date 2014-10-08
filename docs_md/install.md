<!--
This work is licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/3.0/ or send
a letter to Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
-->

# Getting a distro

The easiest way to get hold of a distribution is to [download a binary distro](downloads.html).

Alternatively you can build from source. To do that clone the [github repository](https://github.com/eclipse/vert.x)
and read the file [`BUILD_README.md`](https://github.com/eclipse/vert.x/blob/master/BUILD_README.md).

# Pre-requisites

* Operating System. Vert.x runs out of the box on Linux, OSX or Windows.

* Vert.x requires JDK 1.7.0 or later. You can use the official Oracle distribution or the OpenJDK version. Make sure the JDK bin directory is on your `PATH`.

# Install Vert.x

Once you've got the pre-requisites installed, you install Vert.x as follows:

1. Unzip the distro somewhere sensible (e.g. your home directory)
2. Add the Vert.x `bin` directory to your `PATH` environment variable.

For example

    tar -zxf ~/Downloads/vert.x-2.0.0-final.tar.gz

or

    unzip ~/Downloads/vert.x-2.0.0-final.tar.gz

## Check the version

To make sure you've installed it correctly, use `vertx version` to display the version.

    $ vertx version
    vert.x 2.0.0-final (built ...)

You should see output something like the above.

# Testing the install

Let's test the install by writing a simple web server.

Copy the following into a text editor and save it as `server.js`

    var vertx = require('vertx');

    vertx.createHttpServer().requestHandler(function(req) {
      req.response.end("Hello World!");
    }).listen(8080, 'localhost');

Open a console in the directory where you saved it, and type:

    vertx run server.js

Open your browser and point it at <a href="http://localhost:8080">http://localhost:8080</a>

If you see "Hello World!" in the browser then you're all set to go!
