<!--
This work is licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/3.0/ or send
a letter to Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
-->

[TOC]

# Developing Vert.x modules with Maven

In this guide we'll show you how to develop a Vert.x project using Maven.

# Generate the project

Vert.x provides a Maven Archetype that can generate an example Vert.x Maven project for you. You can then edit and adapt that project to develop your Vert.x module.

To generate a project type the following at the command line, in your project's root directory:

    mvn archetype:generate -Dfilter=io.vertx:

This will search for any artifacts with group id `io.vertx` and interactively prompt you as to which one you want.

You'll also be prompted for:

* `groupId`. This is the `groupId` for the module that we're going to generate, e.g. `com.mycompany`.
* `artifactId`. This is the `artifactId` for the module that we're going to generate, e.g. `my-vertx-module`.
* `version`. This is the `version` for the module that we're going to generate, e.g. `2.0`, or `0.1-SNAPSHOT`.

If you prefer you can specify these parameters on the command line, for example:

    mvn archetype:generate -Dfilter=io.vertx: -DgroupId=com.mycompany -DartifactId=my-vertx-module -Dversion=0.1

A directory with a name corresponding to `artifactId` will be created for you, with the example project in it. Let's go into it:

    cd my-vertx-module

It's a functioning Maven project which creates a working Vert.x module. So you can do all the normal Maven stuff, for example, try:

    mvn install

This builds, tests and installs the module in your local Maven repository, where it can be picked up by other Vert.x modules or projects.

# Outputs

The outputs of the project are:

* The Vert.x module zip file.
* A jar that corresponds to the module. This is useful when you have another project which depends on the classes from your module, as it allows you to add it as a dependency to your other project.

The outputs are created in the `target` directory as per normal.

# Configuring the project

You configure several things as properties in `pom.xml` including

* `module.name` determines the name of the module as described in the [modules manual](mods_manual.html#mod-id)

* `vertx.pullInDeps` determines whether all module dependencies should be packaged into the module as [nested modules](mods_manual.html#nested-mods). 

It also contains various properties used to configure versions of various dependencies.

# Overriding default Vert.x configuration

If you want to override any Vert.x platform configuration, e.g. `langs.properties`, `cluster.xml` or logging configuration, you can add those files to the directory `src/main/platform_lib` - these will then be added to the Vert.x platform classpath when you run the module with `mvn vertx:runMod`


# Other useful Maven targets

To run the integration tests

    mvn integration-test

# Setup your IDE

You can use the `idea` and `eclipse` goals to create IDE projects from your Maven project, for example

    mvn idea:idea

Or

    mvn eclipse:eclipse

Once the IDE files have been created you can open the project in your IDE.

* You may have to tell your IDE to use Java source compatibility level of Java 7, as Maven seems to default to Java 5 (!)*

# Changing the dependencies of your project

If your project needs a third party jar to build and you want to include it in the `lib` directory of your module you can add the dependency in the `dependencies` section of `pom.xml` with a scope of `compile`.

If you don't want it to be included in the `lib` directory you should add it as `provided`.

Once you've changed your dependencies just run `mvn idea:idea` or `mvn eclipse:eclipse` again to update your IDE project files with the new dependencies.

# Pushing your module to Maven

Use `mvn deploy` as normal to push your module to a Maven repository.

# Registering your module in the Module Registry

If you've pushed your module to a public Maven or Bintray repository you can register it in the [Module Registry](http://modulereg.vertx.io) so others can search for and discover it.

# Next steps

Now you've got the project all set-up and running, it's time to [explore the standard project layout](dev_guide.html) itself.



