<!--
This work is licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/3.0/ or send
a letter to Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
-->

[TOC]

This document describes *best practice* for developing Vert.x applications as one or more Vert.x modules using the standard Vert.x project layout. It's highly recommended that you write any non-trivial Vert.x applications as one or more modules. 

Creating your application as module(s) gives you the following benefits:

* Your classpath is encapsulated so modules are easier to run. You don't need to craft any long command lines.
* Your dependencies are encapsulated in a single artifact (the module zip file)
* Your module can be pushed to any Maven repository or Bintray.
* Your module can be catalogued in the Vert.x [module registry](https://vertxmodulereg-vertxmodulereg.rhcloud.com/) so others can discover and use it
* Vert.x can automatically download and install modules from any repository given just the module identifier.

If your application is relatively small it might make sense to create it as a single module. If your application is large split it up into a set of modules.

It's also recommended you read the Vert.x [main manual](manual.html) and the Vert.x [module manual](mods_manual.html) so you understand the basics of Vert.x and modules before starting out.

There should be only one output module per project, so for each module in your application (simple applications may well only have one module) you should create a new project.

The standard layout has a "Maven-style" directory structure that will probably be already familiar with you.

If you're a Gradle user you can clone the Maven Gradle Template Project to get you started quickly.

If you're a Maven user you'll get the same structure if you use the Vert.x Maven Archetype to create your project (without the Gradle files of course!).

If you prefer to use some other build tool (e.g. ant), that's fine - Vert.x is agnostic about build tool, but you'll have to provide your own build script (perhaps someone could contribute one?) for now.

We'll now explore the standard layout.

# The module

All Vert.x modules contain a `mod.json` descriptor. This a file containing some JSON which describes the module. Amongst other things it usually contains a `main` field.
This tells Vert.x which verticle to run when the module is deployed.

The `mod.json` file is in the `src/main/resources` directory of the project. Any files in this directory are copied to the root of the module during packaging.

The thing that is run is called a `Verticle`. A `Verticle` can be written in any of the languages that Vert.x supports.

If you've created your project using the Vert.x Maven Archetype or Vert.x Gradle Template you'll see we have a simple Java Verticle called `PingVerticle`. You can see the source for that in the `src/main/java` sub tree of the project.

The verticle has a `start()` method which is called when the verticle is deployed. In the `start()` method the verticle simply registers a handler on the event bus against address `ping-address`. The handler will be called when a message is received at that address. When a message is received the verticle simply replies to the `ping!` with a `pong!`. 

The standard project layout also contains equivalents of the ping verticle written in JavaScript, Groovy (both compiled and script), Ruby and Python. You can edit `main` in `mod.json` to tell it to you use one of the other versions of the ping verticle.

# The tests

The rest of the stuff in the example project is a set of example tests.

## Unit tests

Unit tests are tests that run outside the Vert.x container and which work with your module's Java classes directly. They go by convention in `src/test/unit`.

You can run unit tests in your IDE as normal by right clicking on the test or on the command line.

## Integration tests

We define *integration tests* here to mean Vert.x tests that are run *inside* the Vert.x container.

We provide a custom JUnit test runner which auto-magically takes your tests, starts up a Vert.x container, runs your test in it, and then reports the test results back, all as if the tests had been run locally as normal JUnit tests.

You can even write your tests in JavaScript, Groovy, Ruby or Python and still use the familiar JUnit Assert API.

There are example integration tests for each language in the example project. If you are not interested in writing tests in different languages you can safely delete the files you're not interested in.

### Java integration tests

The example Java integration tests are in `src/test/java/com/mycompany/integration/java`

Java integration tests subclass `TestVerticle` - after all, the test is run inside the Vert.x container as a verticle. Then you just add standard JUnit test methods to it as normal, annotated with `@Test`.

Please note that the JUnit annotations: `@Before`, `@After`, `@BeforeClass`, `@AfterClass`, and `@Expects` are not currently supported.

Vert.x integration tests are asynchronous so they won't necessarily have finished until after the test method completes, therefore to signal that the test has completed you should call the method `VertxAssert.testComplete()` at the end.

If your test deploys other verticles you can also assert from there and call `testComplete` from there too.

Please see the example tests for more examples.

### JavaScript integration tests

The example Java integration tests are in `src/test/resources/integration_tests/javascript`

The class in `src/test/java/com/mycompany/integration/javascript` is just a stub class that tells JUnit where the real JavaScript tests are. You can safely ignore it.

### Ruby integration tests

The example Java integration tests are in `src/test/resources/integration_tests/ruby`

The class in `src/test/java/com/mycompany/integration/ruby` is just a stub class that tells JUnit where the real Ruby tests are. You can safely ignore it.

### Groovy integration tests

The example Java integration tests are in `src/test/resources/integration_tests/groovy`

The class in `src/test/java/com/mycompany/integration/groovy` is just a stub class that tells JUnit where the real Groovy tests are. You can safely ignore it.

### Python integration tests

The example Java integration tests are in `src/test/resources/integration_tests/python`

The class in `src/test/java/com/mycompany/integration/python` is just a stub class that tells JUnit where the real Python tests are. You can safely ignore it.

### Run tests in your IDE

To run Vert.x integration tests in your IDE, simply open the folder `src/test/java/com/mycompany/integration` in your IDE and right click it and chose to run all tests as JUnit tests (how this is done depends on your IDE). Or you can select individual test classes.

You'll need to make sure you don't have a module built using the command line when running tests in the IDE. Execute `./gradlew clean` or `mvn clean` to make sure or the test run will pick up resources from there instead.

*Note that you can change your code or config and re-run the tests and Vert.x will pick up the changes without you having to rebuild at the command line!*

You can also run the tests at the command line if you prefer (using `mvn integration-tests` or `./gradlew test`)

### Debug tests in your IDE

You can also set breakpoints in your Java code for seamless debugging into your Vert.x verticles and modules as normal. No special set-up is required

<a id="auto-redeploy"> </a>
# Auto redeploy and see your changes immediately

When developing a Vert.x module, especially if it has a web interface, it's often useful to have your module running and have it automatically pick up any changes in classes or other resources in the module *without you having to rebuild the module*.

To get this to work your module must be marked as:

    "auto-redeploy": true

In your `mod.json`. See the [modules manual](mods_manual.html#auto-redeploy) for more information on this.

## Gradle users

Then, if you're using the standard Vert.x Gradle Template project, and you're using Eclipse you can run the following from a console in your project directory:

    ./gradlew runModEclipse

If you're using IntelliJ IDEA:

    ./gradlew runModIDEA

This will start Vert.x running and it will monitor the file system to changes to your module as you edit them and save your changes.


## Maven users

If you're using the Vert.x Maven Plugin you can just run, and you're using Eclipse you can run the following from a console in your project directory:

    mvn vertx:runModEclipse

If you're using IntelliJ IDEA:

    mvn vertx:runModIDEA

This will start Vert.x running and it will monitor the file system to changes to your module as you edit them and save your changes.

If you're using a different IDE (or no IDE!) you can run

   mvn vertx:runModOnCP

And edit the `classpath` configuration parameter in the pom.xml for the plugin, e.g:

    <plugin>
      <groupId>io.vertx</groupId>
      <artifactId>vertx-maven-plugin</artifactId>
      <version>${maven.vertx.plugin.version}</version>
      <configuration>
         <instances>1</instances>
         <classpath>src/main/resources:target/classes</classpath>
      </configuration>
            ....

So it points to the directories where your module resources are.

## Non Maven or Gradle users:

If you don't use Maven or Gradle but still want to see your changes in a running module immediately you can run the following from a console in your project directory:

    vertx runmod com.yourcompany~your-module~1.0 -cp <classpath>

Where `classpath` specifies where the resources of your project are. Let's say you have some of them in
`src/main/resources` and you have your compiled classes in `out/classes`, then you could run:

    vertx runmod com.yourcompany~your-module~1.0 -cp src/main/resources/:out/classes

Then just edit your files in your IDE and when they're saved/compiled the module should be automatically restarted with your changes.

## Working with Multi Module Applications

For larger applications it makes sense to implement them as a set of Vert.x modules.

The application should be made up of several projects (probably created using the Maven archetype or Gradle template), each outputting a single module.

You can then use

    mvn install

Or

    ./gradlew install

From any of the projects to install that module in your local Maven repository, and it will be automatically picked up by your other modules which use it. Vert.x module system understands how to pull modules from local (as well as remote) Maven repositories.

# Other best practices

## Using a Verticle to co-ordinate loading of an application

If you have an application that is composed of multiple verticles that all need to be started at application start-up, then you can use another verticle that maintains the application configuration and starts all the other verticles. You can think of this as your application starter verticle.

For example, you could create a verticle `app.js` (you could use another scripting language - Ruby, Groovy or Python if you prefer) as follows:
    
    // Start the verticles that make up the app  
    
    vertx.deployVerticle("verticle1.js", appConfig.verticle1Config);
    vertx.deployVerticle("verticle2.js", appConfig.verticle2Config, 5);
    vertx.deployVerticle("verticle3.js", appConfig.verticle3Config);
    vertx.deployWorkerVerticle("verticle4.js", appConfig.verticle4Config);
    vertx.deployWorkerVerticle("verticle5.js", appConfig.verticle5Config, 10);

Then set the `app.js` verticle as the main of your module and then you can start your entire application by simply running:

    vertx runmod com.mycompany~my-mod~1.0 -conf conf.json

Where conf.json is a config file like:

    // Application config
    {
        verticle1Config: {
            // Config for verticle1
        },
        verticle2Config: {
            // Config for verticle2
        }, 
        verticle3Config: {
            // Config for verticle3
        },
        verticle4Config: {
            // Config for verticle4
        },
        verticle5Config: {
            // Config for verticle5
        }  
    }  

If your application is large and actually composed of multiple modules rather than verticles you can use the same technique.






