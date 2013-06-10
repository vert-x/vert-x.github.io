vert-x.github.io
================

This is the new (post 2.0) website.

### Pre-requisities

* python markdown
* xsltproc
* vert.x
* sass + compass

### Development

Run `./gen_site.sh` to build user manual.

Run `./runserver.sh` to run a vert.x local web server at http://localhost:8181

Run `compass compile` or `compass watch` to compile scss files into css.

Each new release create new version dir and search and replace old dir for new dir in all files