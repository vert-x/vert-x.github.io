<!--
This work is licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/3.0/ or send
a letter to Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
-->

[TOC]

# Writing Verticles

As was described in the [main manual](manual.html#verticle), a verticle is the execution unit of Vert.x.

To recap, Vert.x is a container which executes packages of code called Verticles, and it ensures that the code in the verticle is never executed concurrently by more than one thread. You can write your verticles in any of the languages that Vert.x supports, and Vert.x supports running many verticle instances concurrently in the same Vert.x instance.

All the code you write in a Vert.x application runs inside a Verticle instance.

For simple prototyping and trivial tasks you can write raw verticles and run them directly on the command line, but in most cases you will always wrap your verticles inside Vert.x [modules](mods_manual.html).

For now, let's try writing a simple raw verticle.

As an example we'll write a simple TCP echo server. The server just accepts connections and any data received by it is echoed back on the connection.

Copy the following into a text editor and save it as `server.js`

    var vertx = require('vertx');

    vertx.createNetServer().connectHandler(function(sock) {
        new vertx.Pump(sock, sock).start();
    }).listen(1234);
    
Now run it:

    vertx run server.js
    
The server will now be running. Connect to it using telnet:

    telnet localhost 1234
    
And notice how data you send (and hit enter) is echoed back to you. 
       
Congratulations! You've written your first verticle.

A JavaScript verticle is simply a JavaScript script that is executed when the verticle is deployed

*In the rest of this manual we'll assume the code snippets are running inside a verticle.*


## Verticle clean-up

Servers, clients, event bus handlers and timers will be automatically closed / cancelled when the verticle is undeployed.

However, if you have any other clean-up logic that you want to execute when the verticle is stopped, you can implement a function called `vertxStop` at the top level of your verticle script which will be called when the verticle is undeployed. For example:

    var vertx = require('vertx');
    var console = require('vertx/console');

    vertx.createNetServer().connectHandler(function(sock) {
        new vertx.Pump(sock, sock).start();
    }).listen(1234);

    function vertxStop() {
       console.log('Verticle has been undeployed');
    }

## The Vert.x APIs

Vert.x implements the APIs in JavaScript as [CommonJS modules](http://wiki.commonjs.org/wiki/Modules/1.1)

CommonJS modules are executed in their own scope and cleanly export an object for you to use.

You get a reference to the object exported by using the `require()` method. This method takes the name of the module as a parameter, and returns the API object.

Most of the Vert.x API modules are namespaced under the 'vertx' namespace - this is to avoid clashes with other CommonJS modules with the same name, e.g. Node.js modules.

### The Core API

The core API is used to do most things in Vert.x including TCP, HTTP, file system access, event bus, timers etc.

You get a reference to the entire Core API object by calling:

    var vertx = require('vertx');

If you only want a part of the core API, e.g. the event bus you can just require that part, for example:

    var eventBus = require('vertx/event_bus');

### The Container API

This represents the Verticle's view of the container in which it is running.

The container object contains methods for deploying and undeploying verticle and modules, and also allows config, environment variables and a logger to be accessed.

To get a reference to the container object you call:

    var container = require('vertx/container');

## The console

If you want to log stuff to the console, you need to require the console object:

    var console = require('vertx/console');

    console.log("hello world!);

## Loading other scripts in the current scope

   To load and execute another JavaScript file in the current scope, you can use the `load` function:

    load("somescript.js");
    foo(); // Call a function defined in the script

        
## Getting Configuration in a Verticle

You can pass configuration to a module or verticle from the command line using the `-conf` option, for example:

    vertx runmod com.mycompany~my-mod~1.0 -conf myconf.json

or for a raw verticle

    vertx run foo.js -conf myconf.json

The argument to `-conf` is the name of a text file containing a valid JSON object.

That configuration is available inside your verticle in the `config` property of the `container` object

    var container = require('vertx/container');
    var console = require('vertx/console');

    var config = container.config;
    
    console.log('config is ' + JSON.stringify(config));
    
Allowing verticles to be configured in a consistent way using JSON allows configuration to be easily passed to them irrespective of the language that deploys the verticle.

## Logging from a Verticle

Each verticle is given its own logger. Yuu get a reference to it from the 'logger' property of the 'container' object:

    var container = require('vertx/container');
    var logger = container.logger;
    
    logger.info("I am logging something");
    
The logger has the following methods:

* trace
* debug
* info
* warn
* error
* fatal           

Which have the normal meanings you would expect.

The log files by default go in a file called `vertx.log` in the system temp directory. On my Linux box this is `\tmp`.

For more information on configuring logging, please see the [main manual](manual.html#logging).

## Accessing environment variables from a Verticle

You can access a hash of environment variables from a Verticle with the `env` property on the `container` object.

    var container = require('vertx/container');
    var sockColour = container.env['GERBIL_SOCKS'];

## Causing the container to exit

You can call the `exit()` function of the container to cause the Vert.x instance to make a clean shutdown.

    var container = require('vertx/container');
    container.exit(); // Bye bye!
   
# Deploying and Undeploying Verticles Programmatically

You can deploy and undeploy verticles programmatically from inside another verticle. Any verticles deployed this way will be able to see resources (classes, scripts, other files) of the main verticle.

## Deploying a simple verticle

To deploy a verticle programmatically call the function `deployVerticle` on the `container` variable. 

To deploy a single instance of a verticle :

    container.deployVerticle(main);    
    
Where `main` is the name of the Verticle (i.e. the name of the script or FQCN of the class).

See the chapter on ["running Vert.x"](manual.html#running-vertx) in the main manual for a description of what a main is.

## Deploying Worker Verticles

The `deployVerticle` method deploys standard (non worker) verticles. If you want to deploy worker verticles use the `deployWorkerVerticle` method. This method takes the same parameters as `deployVerticle` with the same meanings.
    
## Deploying a module programmatically

You should use `deployModule` to deploy a module, for example:

    container.deployModule("io.vertx~mod-mailer~2.0.0-beta1", config);

Would deploy an instance of the `io.vertx~mod-mailer~2.0.0-beta1` module with the specified configuration. Please see the [modules manual]() for more information about modules.
    
## Passing configuration to a verticle programmatically   
  
JSON configuration can be passed to a verticle that is deployed programmatically. Inside the deployed verticle the configuration is accessed with the `config` property. For example:

    var config = {
        foo: "wibble",
        bar: false
    }

    container.deployVerticle("foo.ChildVerticle", config);  // Deploy a Java verticle  

    container.deployVerticle("foo.js", config);  // Deploy a JavaScript verticle

    // etc

            
Then, in `ChildVerticle` you can access the config via `config()` as previously explained.
    
## Using a Verticle to co-ordinate loading of an application

If you have an application that is composed of multiple verticles that all need to be started at application start-up, then you can use another verticle that maintains the application configuration and starts all the other verticles. You can think of this as your application starter verticle.

For example, you could create a verticle `app.js` as follows:
    
    // Start the verticles that make up the app 

    var appConfig = vertx.config(); 
    
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
    
## Specifying number of instances

By default, when you deploy a verticle only one instance of the verticle is deployed. Verticles instances are strictly single threaded so this means you will use at most one core on your server.

Vert.x scales by deploying many verticle instances concurrently.

If you want more than one instance of a particular verticle or module to be deployed, you can specify the number of instances as follows:

    container.deployVerticle("foo.js", 10);  

Or

    container.deployModule("io.vertx~some-mod~1.0", 10);   
  
The above examples would deploy 10 instances.

## Getting Notified when Deployment is complete

The actual verticle deployment is asynchronous and might not complete until some time after the call to `deployVerticle` or `deployModule` has returned. If you want to be notified when the verticle has completed being deployed, you can pass a function handler as the final argument to `deployVerticle` or `deployModule`.

The first argument to the handler is a Java exception object, if an problem occurred, otherwise it's `null`. The second argument is the deployment ID - you will need this if you later wish to undeploy the verticle / module

    container.deployVerticle("foo.js", function(err, deployID) {
      if (!err) {
        console.log("The verticle has been deployed, deployment ID is " + deployID);
      } else {
        console.log("Deployment failed! " + err.getMessage());
      }
    });

## Undeploying a Verticle or Module

Any verticles or modules that you deploy programmatically from within a verticle, and all of their children are automatically undeployed when the parent verticle is undeployed, so in many cases you will not need to undeploy a verticle manually, however if you do need to do this, it can be done by calling the function `undeployVerticle` or `undeployModule` passing in the deployment id. 

    container.undeployVerticle(deploymentID);    

You can also provide a handler to the undeploy method if you want to be informed when undeployment is complete.

# Scaling your application

A verticle instance is almost always single threaded (the only exception is multi-threaded worker verticles which are an advanced feature not intended for normal development), this means a single instance can at most utilise one core of your server.

In order to scale across cores you need to deploy more verticle instances. The exact numbers depend on your application - how many verticles there are and of what type.

You can deploy more verticle instances programmatically or on the command line when deploying your module using the `-instances` command line option.

            
# The Event Bus

The event bus is the nervous system of Vert.x.

It allows verticles to communicate with each other irrespective of what language they are written in, and whether they're in the same Vert.x instance, or in a different Vert.x instance.

It even allows client side JavaScript running in a browser to communicate on the same event bus. (More on that later).

The event bus forms a distributed peer-to-peer network spanning multiple server nodes and multiple browsers.

The event bus API is incredibly simple. It basically involves registering handlers, unregistering handlers and sending and publishing messages.

First some theory:

## The Theory

### Addressing

Messages are sent on the event bus to an *address*.

Vert.x doesn't bother with any fancy addressing schemes. In Vert.x an address is simply a string, any string is valid. However it is wise to use some kind of scheme, e.g. using periods to demarcate a namespace.

Some examples of valid addresses are `europe.news.feed1`, `acme.games.pacman`, `sausages`, and `X`.

### Handlers

A handler is a thing that receives messages from the bus. You register a handler at an address.

Many different handlers from the same or different verticles can be registered at the same address. A single handler can be registered by the verticle at many different addresses.

### Publish / subscribe messaging

The event bus supports *publishing* messages. Messages are published to an address. Publishing means delivering the message to all handlers that are registered at that address. This is the familiar *publish/subscribe* messaging pattern.

### Point to point and Request-Response messaging

The event bus supports *point to point* messaging. Messages are sent to an address. Vert.x will then route it to just one of the handlers registered at that address. If there is more than one handler registered at the address, one will be chosen using a non-strict round-robin algorithm.

With point to point messaging, an optional reply handler can be specified when sending the message. When a message is received by a recipient, and has been handled, the recipient can optionally decide to reply to the message. If they do so that reply handler will be called.

When the reply is received back at the sender, it too can be replied to. This can be repeated ad-infinitum, and allows a dialog to be set-up between two different verticles. This is a common messaging pattern called the *Request-Response* pattern.

### Transient

*All messages in the event bus are transient, and in case of failure of all or parts of the event bus, there is a possibility messages will be lost. If your application cares about lost messages, you should code your handlers to be idempotent, and your senders to retry after recovery.*

If you want to persist your messages you can use a persistent work queue module for that.

### Types of messages

Messages that you send on the event bus can be as simple as a string, a number or a boolean. You can also send Vert.x buffers or JSON messages.

It's highly recommended you use JSON messages to communicate between verticles. JSON is easy to create and parse in all the languages that Vert.x supports.

## Event Bus API

Let's jump into the API.

### Registering and Unregistering Handlers

To set a message handler on the address `test.address`, you do the following:

    var eb = vertx.eventBus;
    
    var myHandler = function(message) {
      console.log('I received a message ' + message);
    }
    
    eb.registerHandler('test.address', myHandler);
    
It's as simple as that. The handler will then receive any messages sent to that address.

When you register a handler on an address and you're in a cluster it can take some time for the knowledge of that new handler to be propagated across the entire cluster. If you want to be notified when that has completed you can optionally specify another function to the `registerHandler` function as the third argument. This function will then be called once the information has reached all nodes of the cluster. E.g. :

    eb.registerHandler('test.address', myHandler, function() {
        console.log('Yippee! The handler info has been propagated across the cluster');
    });

To unregister a handler it's just as straightforward. You simply call `unregisterHandler` passing in the address and the handler:

    eb.unregisterHandler('test.address', myHandler);    
    
A single handler can be registered multiple times on the same, or different, addresses so in order to identify it uniquely you have to specify both the address and the handler. 

As with registering, when you unregister a handler and you're in a cluster it can also take some time for the knowledge of that unregistration to be propagated across the entire to cluster. If you want to be notified when that has completed you can optionally specify another function to the registerHandler as the third argument. E.g. :

    eb.unregisterHandler('test.address', myHandler, function() {
        console.log('Yippee! The handler unregister has been propagated across the cluster');
    });
    
If you want your handler to live for the full lifetime of your verticle there is no need to unregister it explicitly - vert.x will automatically unregister any handlers when the verticle is stopped.    

### Publishing messages
    
Publishing a message is also trivially easy. Just publish it specifying the address, for example:

    eb.publish('test.address', 'hello world');

That message will then be delivered to all handlers registered against the address "test.address".

### Sending messages

Sending a message will result in at most one handler registered at the address receiving the message. This is the point to point messaging pattern. The handler is chosen in a non strict round-robin fashion.

    eb.send('test.address", 'hello world');

### Replying to messages

Sometimes after you send a message you want to receive a reply from the recipient. This is known as the *request-response pattern*.

To do this you send a message, and specify a reply handler as the third argument. When the receiver receives the message they are passed a replier function as the second parameter to the handler. When this function is invoked it causes a reply to be sent back to the sender where the reply handler is invoked. An example will make this clear:

The receiver:

    var myHandler = function(message, replier) {
      console.log('I received a message ' + message);
      
      // Do some stuff
      
      // Now reply to it
      
      replier('This is a reply');
    }
    
    eb.registerHandler('test.address', myHandler);
    
The sender:

    eb.send('test.address', 'This is a message', function(reply) {
        console.log('I received a reply ' + reply);
    });
    
It is legal also to send an empty reply or null reply.

The replies themselves can also be replied to so you can create a dialog between two different verticles consisting of multiple rounds.

### Message types
The message you send can be any of the following types:

* number
* string
* boolean
* JSON object
* Vert.x Buffer

Vert.x buffers and JSON objects are copied before delivery if they are delivered in the same JVM, so different verticles can't access the exact same object instance.

Here are some more examples:

Send some numbers:

    eb.send('test.address', 1234);
    eb.send('test.address', 3.14159);

Send a boolean:

    eb.send('test.address', true);

Send a JSON object:

    var myObj = {
      name: 'Tim',
      address: 'The Moon',
      age: 457
    }
    eb.send('test.address', myObj);

Null messages can also be sent:

    eb.send('test.address', null);

It's a good convention to have your verticles communicating using JSON -this is because JSON is easy to generate and parse for all the languages that Vert.x supports.

## Distributed event bus

To make each Vert.x instance on your network participate on the same event bus, start each Vert.x instance with the `-cluster` command line switch.

See the chapter in the main manual on [*running Vert.x*]() for more information on this. 

Once you've done that, any Vert.x instances started in cluster mode will merge to form a distributed event bus.   
      
# Shared Data

Sometimes it makes sense to allow different verticles instances to share data in a safe way. Vert.x allows simple *Map* and *Set* data structures to be shared between verticles.

There is a caveat: To prevent issues due to mutable data, vert.x only allows simple immutable types such as number, boolean and string or Buffer to be used in shared data. With a Buffer, it is automatically copied when retrieved from the shared data, so different verticle instances never see the same object instance.

Currently data can only be shared between verticles in the *same vert.x instance*. In later versions of vert.x we aim to extend this to allow data to be shared by all vert.x instances in the cluster.

## Shared Maps

To use a shared map to share data between verticles first we get a reference to the map, and then we just use standard `put` and `get` to put and get data from the map:

    var map = vertx.getMap('demo.mymap');
    
    map.put('some-key', 'some-value');
    
And then, in a different verticle:

    var map = vertx.getMap('demo.mymap');
    
    console.log('value of some-key is ' + map.get('some-key');
    
**TODO** More on map API
    
## Shared Sets

To use a shared set to share data between verticles first we get a reference to the set.

    var set = vertx.getSet('demo.myset');
    
    set.add('some-value');
    
And then, in a different verticle:

    var set = vertx.getSet('demo.myset');
    
    // Do something with the set    
                
# Buffers

Most data in vert.x is shuffled around using buffers.

A Buffer represents a sequence of zero or more bytes that can be written to or read from, and which expands automatically as necessary to accomodate any bytes written to it. You can perhaps think of a buffer as smart byte array.

## Creating Buffers

Create a buffer from a String. The String will be encoded in the buffer using UTF-8.

    var buff = new vertx.Buffer('some-string');
    
Create a buffer from a String: The String will be encoded using the specified encoding, e.g:

    var buff = new vertx.Buffer('some-string', 'UTF-16');
    
Create a buffer with an initial size hint. If you know your buffer will have a certain amount of data written to it you can create the buffer and specify this size. This makes the buffer initially allocate that much memory and is more efficient than the buffer automatically resizing multiple times as data is written to it.

Note that buffers created this way *are empty*. It does not create a buffer filled with zeros up to the specified size.
        
    var buff = new vertx.Buffer(100000);   
    
## Writing to a Buffer

There are two ways to write to a buffer: appending, and random access. In either case buffers will always expand automatically to encompass the bytes. It's not possible to write outside the bounds of the buffer.

### Appending to a Buffer

To append to a buffer, you use the `appendXXX` methods. Append methods exist for appending other buffers, strings and numbers.

The return value of the `appendXXX` methods is the buffer itself, so these can be chained:

    var buff = new vertx.Buffer();
    
    buff.appendInt(123).appendString("hello\n");
    
    socket.write(buff);
    
If you want to append a number as an integer to a buffer you must specify how you want to encode it in the buffer

    buff.appendByte(number);  // To append the number as 8 bits (signed)
    
    buff.appendShort(number); // To append the number as 16 bits (signed)
    
    buff.appendInt(number);   // To append the number as 32 bits (signed)
    
    buff.appendLong(number);  // To append the number as 64 bits (signed)
    
With floats, you have to specify whether you want to write the number as a 32 bit or 64 bit double precision float

    buff.appendFloat(number);  // To append the number as a 32-bit IEEE 754 floating point number
    
    buff.appendDouble(number); // To append the number as a 64-bit IEEE 754 double precision floating point number
    
With strings you can specify the encoding, or it will default to UTF-8:

    buff.appendString("hello"); // Write string as UTF-8
    
    buff.appendString("hello", "UTF-16"); // Write string in specified encoding    
    
Use `appendBuffer` to append another buffer

    buff.appendBuffer(anotherBuffer);    

### Random access buffer writes

You can also write into the buffer at a specific index, by using the `setXXX` methods. Set methods exist for other buffers, string and numbers. All the set methods take an index as the first argument - this represents the position in the buffer where to start writing the data.

The buffer will always expand as necessary to accomodate the data.

    var buff = new vertx.Buffer();
    
    buff.setInt(1000, 123);
    buff.setBytes(0, "hello");
    
Similarly to the `appendXXX` methods, when you set a number as an integer you must specify how you want to encode it in the buffer

    buff.setByte(pos, number);  // To set the number as 8 bits (signed)
    
    buff.setShort(pos, number); // To set the number as 16 bits (signed)
    
    buff.setInt(pos, number);   // To set the number as 32 bits (signed)
    
    buff.setLong(pos, number);  // To set the number as 64 bits (signed)
    
Also with floats, you have to specify whether you want to set the number as a 32 bit or 64 bit double precision float

    buff.setFloat(pos, number);  // To set the number as a 32-bit IEEE 754 floating point number
    
    buff.setDouble(pos, number); // To set the number as a 64-bit IEEE 754 double precision floating point number
    
To set strings use the `setString` methods:

    buff.setString(pos, "hello");           // Write string in default UTF-8 encoding
    
    buff.setString(pos, "hello", "UTF-16"); // Write the string in the specified encoding     
    
Use `setBuffer` to set another buffer:

    buff.setBuffer(pos, anotherBuffer);      
    
## Reading from a Buffer

Data is read from a buffer using the `getXXX` methods. Get methods exist for strings and numbers. The first argument to these methods is an index in the buffer from where to get the data.

    var buff = ...;
    for (var i = 0; i < buff.length(); i += 4) {
        console.log("int value at " + i + " is " + buff.getInt(i));
    }
    
To read data as integers, you must specify how many bits you want to read:

    var num = buff.getByte(pos);   // Read signed 8 bits
    
    var num = buff.getShort(pos);  // Read signed 16 bits
    
    var num = buff.getInt(pos);    // Read signed 32 bits
    
    var num = buff.getLong(pos);   // Read signed 64 bits  
    
And with floats, you must specify if you want to read the number as a 32 bit or 64 bit floating point number:

    var num = buff.getFloat(pos);    // Read a 32-bit IEEE 754 floating point number
    
    var num = buff.getDouble(pos);   // Read as a 64-bit IEEE 754 double precision floating point number 
    
You can read data as strings

    var str = buff.getString(pos, end); // Read from pos to end interpreted as a string in UTF-8 encoding.    
    
    var str = buff.getString(pos, end, 'UTF-16'); // Read from pos to end interpreted as a string in the specified encoding.
    
Or as buffers

    var subBuffer = buff.getBuffer(pos, end); // Read from pos to end into another buffer    
    
## Other buffer methods:

* `length()`. To obtain the length of the buffer. The length of a buffer is the index of the byte in the buffer with the largest index + 1.
* `copy()`. Copy the entire buffer

# Delayed and Periodic Tasks

It's very common in Vert.x to want to perform an action after a delay, or periodically.

In standard verticles you can't just make the thread sleep to introduce a delay, as that will block the event loop thread.

Instead you use Vert.x timers. Timers can be *one-shot* or *periodic*. We'll discuss both

## One-shot Timers

A one shot timer calls an event handler after a certain delay, expressed in milliseconds. 

To set a timer to fire once you use the `setTimer` method passing in the delay and a handler function

    var timerID = vertx.setTimer(1000, function(timerID) {
        console.log("And one second later this is printed"); 
    });
        
    console.log("First this is printed");

The return value is a unique timer id which can later be used to cancel the timer. The handler is also passed the timer id.
     
## Periodic Timers

You can also set a timer to fire periodically by using the `setPeriodic` method. There will be an initial delay equal to the period. The return value of `setPeriodic` is a unique timer id (long). This can be later used if the timer needs to be cancelled. The argument passed into the timer event handler is also the unique timer id:

    var timerID = vertx.setPeriodic(1000, function(timerID) {
        console.log("And every second this is printed"); 
    });

    console.log("First this is printed");
    
## Cancelling timers

To cancel a periodic timer, call the `cancelTimer` method specifying the timer id. For example:

    var timerID = vertx.setPeriodic(1000, function(timerID) {
    });
    
    // And immediately cancel it
    
    vertx.cancelTimer(timerID);
    
Or you can cancel it from inside the event handler. The following example cancels the timer after it has fired 10 times.

    var count = 0;
    
    vertx.setPeriodic(1000, function(id) {
        console.log('In event handler ' + count); 
        count++;
        if (count === 10) {
            vertx.cancelTimer(id);
        }
    }); 
        
# Writing TCP Servers and Clients

Creating TCP servers and clients is very easy with Vert.x.

## Net Server

### Creating a Net Server

To create a TCP server you call the `createNetServer` method on your `vertx` instance.

    var server = vertx.createNetServer();
    
### Start the Server Listening    
    
To tell that server to listen for connections we do:    

    var server = vertx.createNetServer();

    server.listen(1234, "myhost");
    
The first parameter to `listen` is the port. A wildcard port of `0` can be specified which means a random available port will be chosen to actually listen at. Once the server has completed listening you can then call the `port()` function of the server to find out the real port it is using.

The second parameter is the hostname or ip address. If it is omitted it will default to `0.0.0.0` which means it will listen at all available interfaces.

The actual bind is asynchronous so the server might not actually be listening until some time *after* the call to listen has returned. If you want to be notified when the server is actually listening you can provide a function to the `listen` call. For example:

    server.listen(1234, "myhost", function(err) {
        if (!err) {
            console.log("Listen succeeded!");
        }
    });

If the listen failed, the `err` parameter will contain a Java exception object.

### Getting Notified of Incoming Connections
    
To be notified when a connection occurs we need to call the `connectHandler` method of the server, passing in a function. The function will then be called when a connection is made:

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
        console.log("A client has connected!");
    });

    server.listen(1234, "localhost");
    
That's a bit more interesting. Now it displays 'A client has connected!' every time a client connects.   

The return value of the `connectHandler` method is the server itself, so multiple invocations can be chained together. That means we can rewrite the above as:

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
        console.log("A client has connected!");
    }).listen(1234, "localhost");
    
or 

    vertx.createNetServer().connectHandler(function(sock) {
        console.log("A client has connected!");
    }).listen(1234, "localhost");
    
    
This is a common pattern throughout the Vert.x API.  
 

### Closing a Net Server

To close a net server just call the `close` function.

    server.close();

The close is actually asynchronous and might not complete until some time after the `close` method has returned. If you want to be notified when the actual close has completed then you can pass in a handler to the `close` method.

This handler will then be called when the close has fully completed.
 
    server.close(function(err) {
        if (!err) {
            console.log("Close succeeded!");
        }
    });  

If the listen failed, the `err` parameter will contain a Java exception object.
    
If you want your net server to last the entire lifetime of your verticle, you don't need to call `close` explicitly, the Vert.x container will automatically close any servers that you created when the verticle is undeployed.    
    
### NetServer Properties

NetServer has a set of properties you can set which affect its behaviour. Firstly there are bunch of properties used to tweak the TCP parameters, in most cases you won't need to set these:

* `tcpNoDelay(tcpNoDelay)` If true then [Nagle's Algorithm](http://en.wikipedia.org/wiki/Nagle's_algorithm) is disabled. If false then it is enabled.

* `sendBufferSize(size)` Sets the TCP send buffer size in bytes.

* `receiveBufferSize(size)` Sets the TCP receive buffer size in bytes.

* `tcpKeepAlive(keepAlive)` if `keepAlive` is true then [TCP keep alive](http://en.wikipedia.org/wiki/Keepalive#TCP_keepalive) is enabled, if false it is disabled. 

* `reuseAddress(reuse)` if `reuse` is true then addresses in TIME_WAIT state can be reused after they have been closed.

* `soLinger(linger)`

* `trafficClass(trafficClass)`

NetServer has a further set of properties which are used to configure SSL. We'll discuss those later on.


### Handling Data

So far we have seen how to create a NetServer, and accept incoming connections, but not how to do anything interesting with the connections. Let's remedy that now.

When a connection is made, the connect handler is called passing in an instance of `NetSocket`. This is a socket-like interface to the actual connection, and allows you to read and write data as well as do various other things like close the socket.


#### Reading Data from the Socket

To read data from the socket you need to set the `dataHandler` on the socket. This handler will be called with a `Buffer` every time data is received on the socket. You could try the following code and telnet to it to send some data:

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
    
        sock.dataHandler(function(buffer) {
            console.log('I received ' + buffer.length() + ' bytes of data');
        });
      
    }).listen(1234, 'localhost');

#### Writing Data to a Socket

To write data to a socket, you invoke the `write` function. This function can be invoked in a few ways:

With a single buffer:

    var myBuffer = new vertx.Buffer(...);
    sock.write(myBuffer);
    
A string. In this case the string will encoded using UTF-8 and the result written to the wire.

    sock.write('hello');    
    
A string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.     

    sock.write('hello', 'UTF-16');
    
The `write` function is asynchronous and always returns immediately after the write has been queued.

Let's put it all together.

Here's an example of a simple TCP echo server which simply writes back (echoes) everything that it receives on the socket:

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
    
        sock.dataHandler(function(buffer) {
            sock.write(buffer);
        });
      
    }).listen(1234, 'localhost');

### Socket Remote Address

You can find out the remote address of the socket (i.e. the address of the other side of the TCP IP connection) by calling `remoteAddress()`.

### Closing a socket

You can close a socket by invoking the `close` method. This will close the underlying TCP connection.

### Closed Handler

If you want to be notified when a socket is closed, you can set the `closedHandler':

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
        
        sock.closedHandler(function() {        
            console.log('The socket is now closed');            
        });
    });

The closed handler will be called irrespective of whether the close was initiated by the client or server.

### Exception handler

You can set an exception handler on the socket that will be called if an exception occurs:

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
        
        sock.exceptionHandler(function(ex) {        
            console.error('Oops. Something went wrong ' + ex.getMessage());            
        });
    });

### Event Bus Write Handler

Every NetSocket automatically registers a handler on the event bus, and when any buffers are received in this handler, it writes them to itself. This enables you to write data to a NetSocket which is potentially in a completely different verticle or even in a different Vert.x instance by sending the buffer to the address of that handler.

The address of the handler is given by the `writeHandlerID()` function.

For example to write some data to the NetSocket from a completely different verticle you could do:

    var writeHandlerID = ... // E.g. retrieve the ID from shared data

    vertx.eventBus.send(writeHandlerID, buffer);
    
### Read and Write Streams

NetSocket also can at as a `ReadStream` and a `WriteStream`. This allows flow control to occur on the connection and the connection data to be pumped to and from other object such as HTTP requests and responses, WebSockets and asynchronous files.

This will be discussed in depth in the chapter on [streams and pumps](#flow-control).


## Scaling TCP Servers

A verticle instance is strictly single threaded.

If you create a simple TCP server and deploy a single instance of it then all the handlers for that server are always executed on the same event loop (thread).

This means that if you are running on a server with a lot of cores, and you only have this one instance deployed then you will have at most one core utilised on your server! 

To remedy this you can simply deploy more instances of the module in the server, e.g.

    vertx runmod com.mycompany~my-mod~1.0 -instances 20

Or for a raw verticle

    vertx run foo.MyApp -instances 20
    
The above would run 20 instances of the module/verticle in the same Vert.x instance.

Once you do this you will find the echo server works functionally identically to before, but, *as if by magic*, all your cores on your server can be utilised and more work can be handled.

At this point you might be asking yourself *'Hold on, how can you have more than one server listening on the same host and port? Surely you will get port conflicts as soon as you try and deploy more than one instance?'*

*Vert.x does a little magic here*.

When you deploy another server on the same host and port as an existing server it doesn't actually try and create a new server listening on the same host/port.

Instead it internally maintains just a single server, and, as incoming connections arrive it distributes them in a round-robin fashion to any of the connect handlers set by the verticles.

Consequently Vert.x TCP servers can scale over available cores while each Vert.x verticle instance remains strictly single threaded, and you don't have to do any special tricks like writing load-balancers in order to scale your server on your multi-core machine.
    
## NetClient

A NetClient is used to make TCP connections to servers.

### Creating a Net Client

To create a TCP client you call the `createNetClient` method on your `vertx` instance.

    var client = vertx.createNetClient();

### Making a Connection

To actually connect to a server you invoke the `connect` method:

    var client = vertx.createNetClient();
    
    client.connect(1234, 'localhost', function(err, sock) {
        if (!err) {
            console.log('We have connected');
        }
    });
    
The connect method takes the port number as the first parameter, followed by the hostname or ip address of the server. The third parameter is a connect handler. This handler will be called when the connection actually occurs.

The first argument passed into the connect handler is a Java exception which will be null if no error occurred, the second parameter is the `NetSocket` which will be null if an error occurred.

You can read and write data from the socket in exactly the same way as you do on the server side.

You can also close it, set the closed handler, set the exception handler and use it as a `ReadStream` or `WriteStream` exactly the same as the server side `NetSocket`.

### Configuring Reconnection

A NetClient can be configured to automatically retry connecting or reconnecting to the server in the event that it cannot connect or has lost its connection. This is done by invoking the functions `setReconnectAttempts()` and `setReconnectInterval()`:

    var client = vertx.createNetClient();
    
    client.reconnectAttempts(1000);
    
    client.reconnectInterval(500);
    
`reconnectAttempts` determines how many times the client will try to connect to the server before giving up. A value of `-1` represents an infinite number of times. The default value is `0`. I.e. no reconnection is attempted.

`reconnectInterval` detemines how long, in milliseconds, the client will wait between reconnect attempts. The default value is `1000`.

### NetClient Properties

Just like `NetServer`, `NetClient` also has a set of TCP properties you can set which affect its behaviour. They have the same meaning as those on `NetServer`.

`NetClient` also has a further set of properties which are used to configure SSL. We'll discuss those later on.

## SSL Servers

Net servers can also be configured to work with [Transport Layer Security](http://en.wikipedia.org/wiki/Transport_Layer_Security) (previously known as SSL).

When a `NetServer` is working as an SSL Server the API of the `NetServer` and `NetSocket` is identical compared to when it working with standard sockets. Getting the server to use SSL is just a matter of configuring the `NetServer` before `listen` is called.

To enabled SSL the function `ssl(true)` must be called on the Net Server.

The server must also be configured with a *key store* and an optional *trust store*.

These are both *Java keystores* which can be managed using the [keytool](http://docs.oracle.com/javase/6/docs/technotes/tools/solaris/keytool.html) utility which ships with the JDK.

The keytool command allows you to create keystores, and import and export certificates from them.

The key store should contain the server certificate. This is mandatory - the client will not be able to connect to the server over SSL if the server does not have a certificate.

The key store is configured on the server using the `keyStorePath()` and `keyStorePassword()` methods.

The trust store is optional and contains the certificates of any clients it should trust. This is only used if client authentication is required. 

To configure a server to use server certificates only:

    var server = vertx.createNetServer().
                   .ssl(true)
                   .keyStorePath('/path/to/your/keystore/server-keystore.jks')
                   .keyStorePassword('password');
    
Making sure that `server-keystore.jks` contains the server certificate.

To configure a server to also require client certificates:

    var server = vertx.createNetServer()
                   .ssl(true)
                   .keyStorePath('/path/to/your/keystore/server-keystore.jks')
                   .keyStorePassword('password')
                   .trustStorePath('/path/to/your/truststore/server-truststore.jks')
                   .trustStorePassword('password')
                   .clientAuthRequired(true);
    
Making sure that `server-truststore.jks` contains the certificates of any clients who the server trusts.

If `clientAuthRequired` is set to `true` and the client cannot provide a certificate, or it provides a certificate that the server does not trust then the connection attempt will not succeed.

## SSL Clients

Net Clients can also be easily configured to use SSL. They have the exact same API when using SSL as when using standard sockets.

To enable SSL on a `NetClient` the function `ssl(true)` is called.

If the `trustAll(true)` is invoked on the client, then the client will trust all server certificates. The connection will still be encrypted but this mode is vulnerable to 'man in the middle' attacks. I.e. you can't be sure who you are connecting to. Use this with caution. Default value is `false`.

If `trustAll` is false then a client trust store must be configured and should contain the certificates of the servers that the client trusts.

The client trust store is just a standard Java key store, the same as the key stores on the server side. The client trust store location is set by using the function `trustStorePath()` on the `NetClient`. If a server presents a certificate during connection which is not in the client trust store, the connection attempt will not succeed.

If the server requires client authentication then the client must present its own certificate to the server when connecting. This certificate should reside in the client key store. Again it's just a regular Java key store. The client keystore location is set by using the function `keyStorePath()` on the `NetClient`. 

To configure a client to trust all server certificates (dangerous):

    var client = vertx.createNetClient()
                   .ssl(true)
                   .trustAll(true);
    
To configure a client to only trust those certificates it has in its trust store:

    var client = vertx.createNetClient()
                   .ssl(true)
                   .trustStorePath('/path/to/your/client/truststore/client-truststore.jks')
                   .trustStorePassword('password');
                   
To configure a client to only trust those certificates it has in its trust store, and also to supply a client certificate:

    var client = vertx.createNetClient()
                   .ssl(true)
                   .trustStorePath('/path/to/your/client/truststore/client-truststore.jks')
                   .trustStorePassword('password')
                   .clientAuthRequired(true)
                   .keyStorePath('/path/to/keystore/holding/client/cert/client-keystore.jks')
                   .keyStorePassword('password');
                     
<a id="flow-control"> </a> 
# Flow Control - Streams and Pumps

There are several objects in vert.x that allow data to be read from and written to in the form of Buffers.

In Vert.x, calls to write data return immediately and writes are internally queued.

It's not hard to see that if you write to an object faster than it can actually write the data to its underlying resource then the write queue could grow without bound - eventually resulting in exhausting available memory.

To solve this problem a simple flow control capability is provided by some objects in the vert.x API.

Any flow control aware object that can be written to is said to implement `WriteStream`, and any flow control object that can be read from is said to implement `ReadStream`.

Let's take an example where we want to read from a `ReadStream` and write the data to a `WriteStream`.

A very simple example would be reading from a `NetSocket` on a server and writing back to the same `NetSocket` - since `NetSocket` implements both `ReadStream` and `WriteStream`, but you can do this between any `ReadStream` and any `WriteStream`, including HTTP requests and response, async files, WebSockets, etc.

A naive way to do this would be to directly take the data that's been read and immediately write it to the NetSocket, for example:

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
    
        sock.dataHandler(function(buffer) {
      
            // Write data straight back on the socket
                  
            sock.write(buffer); 
        });
                
    }).listen(1234, 'localhost');
    
There's a problem with the above example: If data is read from the socket faster than it can be written back to the socket, it will build up in the write queue of the `NetSocket`, eventually running out of RAM. This might happen, for example if the client at the other end of the socket wasn't reading very fast, effectively putting back-pressure on the connection.

Since `NetSocket` implements `WriteStream`, we can check if the `WriteStream` is full before writing to it:

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
    
        sock.dataHandler(function(buffer) {
      
            if (!sock.writeQueueFull()) {      
                sock.write(buffer); 
            }
        });
                
    }).listen(1234, 'localhost');
    
This example won't run out of RAM but we'll end up losing data if the write queue gets full. What we really want to do is pause the `NetSocket` when the write queue is full. Let's do that:

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
    
        sock.dataHandler(function(buffer) {
      
            sock.write(buffer); 
            if (sock.writeQueueFull()) {      
                sock.pause();
            }
        });
                
    }).listen(1234, 'localhost');

We're almost there, but not quite. The `NetSocket` now gets paused when the file is full, but we also need to *unpause* it when the write queue has processed its backlog:

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
    
        sock.dataHandler(function(buffer) {
      
            sock.write(buffer); 
            if (sock.writeQueueFull()) {      
                sock.pause();
                
                sock.drainHandler(function() {
                    sock.write(buffer);
                    sock.resume();
                });
            }
        });
                
    }).listen(1234, 'localhost');

And there we have it. The `drainHandler` event handler will get called when the write queue is ready to accept more data, this resumes the `NetSocket` which allows it to read more data.

It's very common to want to do this when writing vert.x applications, so we provide a helper class called `Pump` which does all this hard work for you. You just feed it the `ReadStream` and the `WriteStream` and it tell it to start:

    var server = vertx.createNetServer();

    server.connectHandler(function(sock) {
    
        var pump = new vertx.Pump(sock, sock);
        pump.start();
                
    }).listen(1234, 'localhost');
    
Which does exactly the same thing as the more verbose example.

Let's look at the methods on `ReadStream` and `WriteStream` in more detail:

## ReadStream

`ReadStream` is implemented by `AsyncFile`, `HttpClientResponse`, `HttpServerRequest`, `WebSocket`, `NetSocket` and `SockJSSocket`.

Functions:

* `dataHandler(handler)`: set a handler which will receive data from the `ReadStream`. As data arrives the handler will be passed a Buffer.
* `pause()`: pause the handler. When paused no data will be received in the `dataHandler`.
* `resume()`: resume the handler. The handler will be called if any data arrives.
* `exceptionHandler(handler)`: The handler will be called if an exception occurs on the `ReadStream`.
* `endHandler(handler)`: The handeler will be called when end of stream is reached. This might be when EOF is reached if the `ReadStream` represents a file, or when end of request is reached if it's an HTTP request, or when the connection is closed if it's a TCP socket.

## WriteStream

`WriteStream` is implemented by `AsyncFile`, `HttpClientRequest`, `HttpServerResponse`, `WebSocket`, `NetSocket` and `SockJSSocket`

Functions:

* `write(buffer)`: write a Buffer to the `WriteStream`. This method will never block. Writes are queued internally and asynchronously written to the underlying resource.
* `writeQueueMaxSize(size)`: set the number of bytes at which the write queue is considered *full*, and the function `writeQueueFull()` returns `true`. Note that, even if the write queue is considered full, if `write` is called the data will still be accepted and queued.
* `writeQueueFull()`: returns `true` if the write queue is considered full.
* `exceptionHandler(handler)`: The handler will be called if an exception occurs on the `WriteStream`.
* `drainHandler(handler)`: The handler will be called if the `WriteStream` is considered no longer full.

## Pump

Instances of `Pump` have the following methods:

* `start()`: Start the pump.
* `stop()`: Stops the pump. When the pump starts it is in stopped mode.
* `writeQueueMaxSize(size)`: This has the same meaning as `writeQueueMaxSize` on the `WriteStream`.
* `bytesPumped()`: Returns total number of bytes pumped.

A pump can be started and stopped multiple times.

When a pump is first created it is *not* started. You need to call the `start()` method to start it.

# Writing HTTP Servers and Clients

## Writing HTTP servers

Vert.x allows you to easily write full featured, highly performant and scalable HTTP servers.

### Creating an HTTP Server

To create an HTTP server you call the `createHttpServer()` function on your `vertx` instance.

    var server = vertx.createHttpServer();
    
### Start the Server Listening    
    
To tell that server to listen for incoming requests you use the `listen` function:

    var server = vertx.createHttpServer();

    server.listen(8080, "myhost");
    
The first parameter to `listen` is the port. 

The second parameter is the hostname or ip address. If it is omitted it will default to `0.0.0.0` which means it will listen at all available interfaces.

The actual bind is asynchronous so the server might not actually be listening until some time *after* the call to listen has returned. If you want to be notified when the server is actually listening you can provide a handler to the `listen` call. For example:

    server.listen(8080, "myhost", function(err) {
        if (!err) {
            console.log("Listen succeeded!");
        }
    });

If the listen failed a Java exception will be passed into the handler.


### Getting Notified of Incoming Requests
    
To be notified when a request arrives you need to set a request handler. This is done by calling the `requestHandler()` function of the server, passing in the handler:

    var server = vertx.createHttpServer();

    server.requestHandler(function(request) {
      console.log('An HTTP request has been received');
    })  

    server.listen(8080, 'localhost');
    
This displays 'An HTTP request has been received!' every time an HTTP request arrives on the server. You can try it by running the verticle and pointing your browser at `http://localhost:8080`.

Similarly to `NetServer`, the return value of the `requestHandler` method is the server itself, so multiple invocations can be chained together. That means we can rewrite the above with:

    var server = vertx.createHttpServer();

    server.requestHandler(function(request) {
      console.log('An HTTP request has been received');
    }).listen(8080, 'localhost');
    
Or:

    vertx.createHttpServer().requestHandler(function(request) {
      console.log('An HTTP request has been received');
    }).listen(8080, 'localhost');
    
       
### Handling HTTP Requests

So far we have seen how to create an `HttpServer` and be notified of requests. Lets take a look at how to handle the requests and do something useful with them.

When a request arrives, the request handler is called passing in an instance of `HttpServerRequest`. This object represents the server side HTTP request.

The handler is called when the headers of the request have been fully read. If the request contains a body, that body may arrive at the server some time after the request handler has been called.

It contains functions to get the URI, path, request headers and request parameters. It also contains a `response` property which is a reference to an object that represents the server side HTTP response for the object.

#### Request Method

The request object has a method `method()` which returns a string representing what HTTP method was requested. Possible return values for `method()` are: `GET`, `PUT`, `POST`, `DELETE`, `HEAD`, `OPTIONS`, `CONNECT`, `TRACE`, `PATCH`.

#### Request Version

The request object has a method `version()` which returns a string representing the HTTP version.

#### Request URI

The request object has a method `uri()` which returns the full URI (Uniform Resource Locator) of the request. For example, if the request URI was:

    /a/b/c/page.html?param1=abc&param2=xyz    
    
Then `request.uri()` would return the string `/a/b/c/page.html?param1=abc&param2=xyz`.

Request URIs can be relative or absolute (with a domain) depending on what the client sent. In most cases they will be relative.

The request uri contains the value as defined in [Section 5.1.2 of the HTTP specification - Request-URI](http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html)

#### Request Path

The request object has a method `path()` which returns the path of the request. For example, if the request URI was:

    a/b/c/page.html?param1=abc&param2=xyz    
    
Then `request.path()` would return the string `/a/b/c/page.html`
   
#### Request Query

The request object has a method `query()` which contains the query of the request. For example, if the request URI was:

    a/b/c/page.html?param1=abc&param2=xyz    
    
Then `request.query()` would return the string `param1=abc&param2=xyz`    
        
#### Request Headers

The request headers are available using the `headers()` method on the request object.

The returned object represents a multi-map of the headers. A MultiMap allows multiple values for the same key, unlike a normal Map.

Here's an example that echoes the headers to the output of the response. Run it and point your browser at `http://localhost:8080` to see the headers.

    var server = vertx.createHttpServer();

    server.requestHandler(function(request) {
    
      var str = '';
      request.headers().forEach(function(key, value) {
        str = str.concat(key, ': ', value, '\n');
      });
      
      request.response.end(str);
      
    }).listen(8080, 'localhost');


#### Request params

Similarly to the headers, the request parameters are available using the `params()` method on the request object.   

The returned object is also a MultiMap.  

Request parameters are sent on the request URI, after the path. For example if the URI was:

    /page.html?param1=abc&param2=xyz
    
Then the params multi-map would contain the following entries:

    param1: 'abc'
    param2: 'xyz

#### Remote Address

Use the function `remoteAddress()` to find out the address of the other side of the HTTP connection.

#### Absolute URI

Use the function `absoluteURI()` to return the absolute URI corresponding to the request.
    
#### Reading Data from the Request Body

Sometimes an HTTP request contains a request body that we want to read. As previously mentioned the request handler is called when only the headers of the request have arrived so the `HttpServerRequest` object does not contain the body. This is because the body may be very large and we don't want to create problems with exceeding available memory.

To receive the body, you set the `dataHandler` on the request object. This will then get called every time a chunk of the request body arrives. Here's an example:

    var server = vertx.createHttpServer();

    server.requestHandler(function(request) {
    
      request.dataHandler(function(buffer) {
        console.log('I received ' + buffer.length() + ' bytes');
      });
      
    }).listen(8080, 'localhost'); 
    
The `dataHandler` may be called more than once depending on the size of the body.    

You'll notice this is very similar to how data from `NetSocket` is read. 

The request object implements the `ReadStream` interface so you can pump the request body to a `WriteStream`. See the chapter on streams and pumps for a detailed explanation. 

In many cases, you know the body is not large and you just want to receive it in one go. To do this you could do something like the following:

    var server = vertx.createHttpServer();

    server.requestHandler(function(request) {
    
      // Create a buffer to hold the body
      var body = new vertx.Buffer();  
    
      request.dataHandler(function(buffer) {
        // Append the chunk to the buffer
        body.appendBuffer(buffer);
      });
      
      request.endHandler(function() {
        // The entire body has now been received
        console.log('The total body received was ' + body.length() + ' bytes');
      });
      
    }).listen(8080, 'localhost');   
    
Like any `ReadStream` the end handler is invoked when the end of stream is reached - in this case at the end of the request.

If the HTTP request is using HTTP chunking, then each HTTP chunk of the request body will correspond to a single call of the data handler.

It's a very common use case to want to read the entire body before processing it, so vert.x allows a `bodyHandler` to be set on the request object.

The body handler is called only once when the *entire* request body has been read.

*Beware of doing this with very large requests since the entire request body will be stored in memory.*

Here's an example using `bodyHandler`:

    var server = vertx.createHttpServer();

    server.requestHandler(function(request) {
    
      request.bodyHandler(function(body) {
        console.log('The total body received was ' + body.length() + ' bytes');
      });
      
    }).listen(8080, 'localhost');  
    

#### Handling Multipart Form Uploads

Vert.x understands file uploads submitted from HTML forms in browsers. In order to handle file uploads you should set the `uploadHandler` on the request. The handler will be called once for each upload in the form.

    request.expectMultiPart(true);

    request.uploadHandler(function(upload) {
    });

The `HttpServerFileUpload` class implements `ReadStream` so you read the data and stream it to any object that implements `WriteStream` using a Pump, as previously discussed.

You can also stream it directly to disk using the convenience method `streamToFileSystem()`.

    request.expectMultiPart(true);

    request.uploadHandler(function(upload) {
        upload.streamToFileSystem("uploads/" + upload.filename());
    });

#### Handling Multipart Form Attributes

If the request corresponds to an HTML form that was submitted you can use the function `formAttributes` to retrieve a Multi Map of the form attributes. This should only be called after *all* of the request has been read - this is because form attributes are encoded in the request *body* not in the request headers.

    request.endHandler(function() {
        // The request has been all ready so now we can look at the form attributes
        var attrs = request.formAttributes();
        // Do something with them
    });
    
    
### HTTP Server Responses 

As previously mentioned, the HTTP request object contains a property `response`. This returns the HTTP response for the request. You use it to write the response back to the client.

### Setting Status Code and Message

To set the HTTP status code for the response use the `statusCode()` function, e.g.

    var server = vertx.createHttpServer();

    server.requestHandler(function(req) {
        request.response.statusCode(777).statusMessage("Too many gerbils").end();       
    }).listen(8080, "localhost");
    
You can also use the `statusMessage()` function to set the status message. If you do not set the status message a default message will be used.    
  
The default value for `statusCode` is `200`.    
  
#### Writing HTTP responses

To write data to an HTTP response, you invoke the `write` function. This function can be invoked multiple times before the response is ended. It can be invoked in a few ways:

With a single buffer:

    var myBuffer = ...
    request.response.write(myBuffer);
    
A string. In this case the string will encoded using UTF-8 and the result written to the wire.

    request.response.write("hello");    
    
A string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.     

    request.response.write("hello", "UTF-16");
    
The `write` function is asynchronous and always returns immediately after the write has been queued.

If you are just writing a single string or Buffer to the HTTP response you can write it and end the response in a single call to the `end` method.

The first call to `write` results in the response header being being written to the response.

Consequently, if you are not using HTTP chunking then you must set the `Content-Length` header before writing to the response, since it will be too late otherwise. If you are using HTTP chunking you do not have to worry. 
   
#### Ending HTTP responses

Once you have finished with the HTTP response you must call the `end()` function on it.

This function can be invoked in several ways:

With no arguments, the response is simply ended. 

    request.response.end();
    
The function can also be called with a string or Buffer in the same way `write` is called. In this case it's just the same as calling write with a string or Buffer followed by calling `end` with no arguments. For example:

    request.response.end("That's all folks");

#### Closing the underlying connection

You can close the underlying TCP connection of the request by calling the `close` method.

    request.response.close();

#### Response headers

HTTP response headers can be added to the response by adding them to the multimap returned from the `headers()` method:

    request.response.headers().set("Cheese", "Stilton");
    request.response.headers().set("Hat colour", "Mauve");

Individual HTTP response headers can also be written using the `putHeader` method. This allows a fluent API since calls to `putHeader` can be chained:

    request.response.putHeader("Some-Header", "elephants").putHeader("Pants", "Absent");
    
Response headers must all be added before any parts of the response body are written.
    
#### Chunked HTTP Responses and Trailers

Vert.x supports [HTTP Chunked Transfer Encoding](http://en.wikipedia.org/wiki/Chunked_transfer_encoding). This allows the HTTP response body to be written in chunks, and is normally used when a large response body is being streamed to a client, whose size is not known in advance.

You put the HTTP response into chunked mode as follows:

    req.response.chunked(true);
    
Default is non-chunked. When in chunked mode, each call to `response.write(...)` will result in a new HTTP chunk being written out.  

When in chunked mode you can also write HTTP response trailers to the response. These are actually written in the final chunk of the response.  

To add trailers to the response, add them to the multimap returned from the `trailers()` method:

    request.response.trailers().set("Philosophy", "Solipsism");
    request.response.trailers().set("Favourite-Shakin-Stevens-Song", "Behind the Green Door");

Like headers, individual HTTP response trailers can also be written using the `putTrailer()` method. This allows a fluent API since calls to `putTrailer` can be chained:

    request.response.putTrailer("Cat-Food", "Whiskas").putTrailer("Eye-Wear", "Monocle");
    

### Serving files directly from disk

If you were writing a web server, one way to serve a file from disk would be to open it as an `AsyncFile` and pump it to the HTTP response. Or you could load it it one go using the file system API and write that to the HTTP response.

Alternatively, Vert.x provides a method which allows you to serve a file from disk to an HTTP response in one operation. Where supported by the underlying operating system this may result in the OS directly transferring bytes from the file to the socket without being copied through userspace at all.

Using `sendFile` is usually more efficient for large files, but may be slower for small files than using `readFile` to manually read the file as a buffer and write it directly to the response.

To do this use the `sendFile` function on the HTTP response. Here's a simple HTTP web server that serves static files from the local `web` directory:

    var server = vertx.createHttpServer();

    server.requestHandler(function(req) {
      var file = '';
      if (req.path() == '/') {
        file = 'index.html';
      } else if (req.path().indexOf('..') == -1) {
        file = req.path();
      }
      req.response.sendFile('web/' + file);   
    }).listen(8080, 'localhost');

There's also a version of `sendFile` which takes the name of a file to serve if the specified file cannot be found:

    req.response.sendFile("web/" + file, "handler_404.html");  

*Note: If you use `sendFile` while using HTTPS it will copy through userspace, since if the kernel is copying data directly from disk to socket it doesn't give us an opportunity to apply any encryption.*

**If you're going to write web servers using Vert.x be careful that users cannot exploit the path to access files outside the directory from which you want to serve them.**

### Pumping Responses

Since the HTTP Response implements `WriteStream` you can pump to it from any `ReadStream`, e.g. an `AsyncFile`, `NetSocket` or `HttpServerRequest`.

Here's an example which echoes HttpRequest headers and body back in the HttpResponse. It uses a pump for the body, so it will work even if the HTTP request body is much larger than can fit in memory at any one time:

    var server = vertx.createHttpServer();

    server.requestHandler(function(req) {
      
      req.response.putAllHeaders(req.headers());
      
      new Pump(req, req.response).start();
      
      req.endHandler(function() { req.response.end(); });
      
    }).listen(8080, 'localhost');

    
## Writing HTTP Clients

### Creating an HTTP Client

To create an HTTP client you call the `createHttpClient` method on your `vertx` instance:

    var client = vertx.createHttpClient();
    
You set the port and hostname (or ip address) that the client will connect to using the `port()` and `host()` functions:

    var client = vertx.createHttpClient();
    client.port(8181);
    client.host("foo.com");
    
This, of course, can be chained:

    var client = vertx.createHttpClient()
        .port(8181)
        .host("foo.com");
                   
A single `HTTPClient` always connects to the same host and port. If you want to connect to different servers, create more instances.

The default port is `80` and the default host is `localhost`. So if you don't explicitly set these values that's what the client will attempt to connect to.         

### Pooling and Keep Alive

By default the `HTTPClient` pools HTTP connections. As you make requests a connection is borrowed from the pool and returned when the HTTP response has ended.

If you do not want connections to be pooled you can call `setKeepAlive` with `false`:

    var client = vertx.createHttpClient()
                   .port(8181)
                   .host("foo.com").
                   .keepAlive(false);

In this case a new connection will be created for each HTTP request and closed once the response has ended.

You can set the maximum number of connections that the client will pool as follows:

    var client = vertx.createHttpClient()
                   .port(8181)
                   .host("foo.com").
                   .maxPoolSize(10);
                   
The default value is `1`.         

### Closing the client

Any HTTP clients created in a verticle are automatically closed for you when the verticle is stopped, however if you want to close it explicitly you can:

    client.close();             
                         
### Making Requests

To make a request using the client you invoke one the methods named after the HTTP method that you want to invoke.

For example, to make a `POST` request:

    var client = vertx.createHttpClient().host("foo.com");
    
    var request = client.post("/some-path/", function(resp) {
        console.log("Got a response: " + resp.statusCode());
    });
    
    request.end();
    
To make a PUT request use the `put` method, to make a GET request use the `get` method, etc.

Legal request methods are: `get`, `put`, `post`, `delete`, `head`, `options`, `connect`, `trace` and `patch`.

The general modus operandi is you invoke the appropriate method passing in the request URI as the first parameter, the second parameter is an event handler which will get called when the corresponding response arrives. The response handler is passed the client response object as an argument.

The value specified in the request URI corresponds to the Request-URI as specified in [Section 5.1.2 of the HTTP specification](http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html). *In most cases it will be a relative URI*.

*Please note that the domain/port that the client connects to is determined by `port()` and `host()`, and is not parsed from the uri.*

The return value from the appropriate request method is the client request object. You can use this to add headers to the request, and to write to the request body. The request object implements `WriteStream`.

Once you have finished with the request you must call the `end()` function.

If you don't know the name of the request method in advance there is a general `request` function which takes the HTTP method as a parameter:

    var client = vertx.createHttpClient().host("foo.com");
    
    var request = client.request("POST", "/some-path/", function(resp) {
        console.log("Got a response: " + resp.statusCode());
    });
    
    request.end();
    
There is also a function called `getNow` which does the same as `get`, but automatically ends the request. This is useful for simple GETs which don't have a request body:

    var client = vertx.createHttpClient().host("foo.com");
    
    client.getNow("/some-path/", function(resp) {
        console.log("Got a response: " + resp.statusCode());
    });
    

#### Handling exceptions

You can set an exception handler on the `HttpClient` and it will receive all exceptions for the client unless a specific exception handler has been set on a specific request object.

#### Writing to the request body

Writing to the client request body has a very similar API to writing to the server response body.

To write data to an `HttpClientRequest` object, you invoke the `write` function. This function can be called multiple times before the request has ended. It can be invoked in a few ways:

With a single buffer:

    var myBuffer = ...
    request.write(myBuffer);
    
A string. In this case the string will encoded using UTF-8 and the result written to the wire.

    request.write("hello");    
    
A string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.     

    request.write("hello", "UTF-16");
    
The `write` function is asynchronous and always returns immediately after the write has been queued. The actual write might complete some time later.
    
If you are just writing a single string or Buffer to the HTTP request you can write it and end the request in a single call to the `end` function.   

The first call to `write` will result in the request headers being written to the request. Consequently, if you are not using HTTP chunking then you must set the `Content-Length` header before writing to the request, since it will be too late otherwise. If you are using HTTP chunking you do not have to worry. 


#### Ending HTTP requests

Once you have finished with the HTTP request you must call the `end` function on it.

This function can be invoked in several ways:

With no arguments, the request is simply ended. 

    request.end();
    
The function can also be called with a string or Buffer in the same way `write` is called. In this case it's just the same as calling write with a string or Buffer followed by calling `end` with no arguments.

#### Writing Request Headers

To write headers to the request, add them to the multi-map returned from the `headers()` method:

    var client = vertx.createHttpClient().host("foo.com");
    
    var request = client.request("POST", "/some-path/", function(resp) {
        console.log("Got a response: " + resp.statusCode());
    });
    
    request.headers().set("Some-Header", "Some-Value");
    request.end();
    
You can also adds them using the `putHeader` method. This enables a more fluent API since calls can be chained, for example:

    request.putHeader("Some-Header", "Some-Value").putHeader("Some-Other", "Blah");
    
These can all be chained together as per the common Vert.x API pattern:

    vertx.createHttpClient().host("foo.com").request("POST", "/some-path/", function(resp) {
        console.log("Got a response: " + resp.statusCode());
    }).putHeader("Some-Header", "Some-Value").putHeader("Some-Other", "Blah").end();

#### Request timeouts

You can set a timeout for specific Http Request using the `timeout()` function. If the request does not return any data within the timeout period an exception will be passed to the exception handler (if provided) and the request will be closed.

#### HTTP chunked requests

Vert.x supports [HTTP Chunked Transfer Encoding](http://en.wikipedia.org/wiki/Chunked_transfer_encoding) for requests. This allows the HTTP request body to be written in chunks, and is normally used when a large request body is being streamed to the server, whose size is not known in advance.

You put the HTTP request into chunked mode as follows:

    request.chunked(true);
    
Default is non-chunked. When in chunked mode, each call to `request.write(...)` will result in a new HTTP chunk being written out.  

### HTTP Client Responses

Client responses are received as an argument to the response handler that is passed into one of the request methods on the HTTP client.

The response object implements `ReadStream`, so it can be pumped to a `WriteStream` like any other `ReadStream`.

To query the status code of the response use the `statusCode()` function. The `statusMessage()` function contains the status message. For example:

    var client = vertx.createHttpClient().host("foo.com");
    
    client.getNow("/some-path/", function(resp) {
        console.log('server returned status code: ' + resp.statusCode());   
        console.log('server returned status message: ' + resp.statusMessage());   
    });

#### Reading Data from the Response Body

The API for reading a http client response body is very similar to the API for reading a http server request body.

Sometimes an HTTP response contains a request body that we want to read. Like an HTTP request, the client response handler is called when all the response headers have arrived, not when the entire response body has arrived.

To receive the response body, you set a `dataHandler` on the response object which gets called as parts of the HTTP response arrive. Here's an example:


    var client = vertx.createHttpClient().host('foo.com');
    
    client.getNow('/some-path', function(resp) {
      resp.dataHandler(function(buffer) {
        console.log('I received ' + buffer.length() + ' bytes');
      });    
    });

The response object implements the `ReadStream` interface so you can pump the response body to a `WriteStream`. See the chapter on streams and pump for a detailed explanation. 

The `dataHandler` can be called multiple times for a single HTTP response.

As with a server request, if you wanted to read the entire response body before doing something with it you could do something like the following:

    var client = vertx.createHttpClient().host('foo.com');
    
    client.getNow('/some-path', function(resp) {
      
      // Create a buffer to hold the entire response body
      var body = new vertx.Buffer();  
    
      resp.dataHandler(function(buffer) {
        // Add chunk to the buffer
        body.appendBuffer(buffer);
      });
      
      resp.endHandler(function() {
        // The entire response body has been received
        console.log('The total body received was ' + body.length() + ' bytes');
      });
      
    });
    
Like any `ReadStream` the end handler is invoked when the end of stream is reached - in this case at the end of the response.

If the HTTP response is using HTTP chunking, then each chunk of the response body will correspond to a single call to the `dataHandler`.

It's a very common use case to want to read the entire body in one go, so vert.x allows a `bodyHandler` to be set on the response object.

The body handler is called only once when the *entire* response body has been read.

*Beware of doing this with very large responses since the entire response body will be stored in memory.*

Here's an example using `bodyHandler`:

    var client = vertx.createHttpClient().host('foo.com');
    
    client.getNow('/some-uri', function(resp) {
      
      resp.bodyHandler(function(body) {
        console.log('The total body received was ' + body.length() + ' bytes');
      });
      
    }); 

#### Reading cookies

You can read the list of cookies from the response using the method `cookies()`.

   
### 100-Continue Handling

According to the [HTTP 1.1 specification](http://www.w3.org/Protocols/rfc2616/rfc2616-sec8.html) a client can set a header `Expect: 100-Continue` and send the request header before sending the rest of the request body.

The server can then respond with an interim response status `Status: 100 (Continue)` to signify the client is ok to send the rest of the body.

The idea here is it allows the server to authorise and accept/reject the request before large amounts of data is sent. Sending large amounts of data if the request might not be accepted is a waste of bandwidth and ties up the server in reading data that it will just discard.

Vert.x allows you to set a `continueHandler` on the client request object. This will be called if the server sends back a `Status: 100 (Continue)` response to signify it is ok to send the rest of the request.

This is used in conjunction with the `sendHead` function to send the head of the request.

An example will illustrate this:

    var client = vertx.createHttpClient().host('foo.com');
    
    var request = client.put('/some-path', function(resp) {
      
      console.log('Got a response ' + resp.statusCode);
      
    });     
    
    request.putHeader('Expect', '100-Continue');
    
    request.continueHandler(function() {
        // OK to send rest of body
        
        request.write('Some data').end();
    });
    
    request.sendHead();

## Pumping Requests and Responses

The HTTP client and server requests and responses all implement either `ReadStream` or `WriteStream`. This means you can pump between them and any other read and write streams.
    

## HTTPS Servers

HTTPS servers are very easy to write using Vert.x.

An HTTPS server has an identical API to a standard HTTP server. Getting the server to use HTTPS is just a matter of configuring the HTTP Server before `listen` is called.

Configuration of an HTTPS server is done in exactly the same way as configuring a `NetServer` for SSL. Please see SSL server chapter for detailed instructions.

## HTTPS Clients

HTTPS clients can also be very easily written with Vert.x

Configuring an HTTP client for HTTPS is done in exactly the same way as configuring a `NetClient` for SSL. Please see SSL client chapter for detailed instructions. 

## Scaling HTTP servers

Scaling an HTTP or HTTPS server over multiple cores is as simple as deploying more instances of the verticle. For example:

    vertx runmod com.mycompany~my-mod~1.0 -instance 20

Or, for a raw verticle:

    vertx run foo.MyServer -instances 20
    
The scaling works in the same way as scaling a `NetServer`. Please see the chapter on scaling Net Servers for a detailed explanation of how this works.

# Routing HTTP requests with Pattern Matching

Vert.x lets you route HTTP requests to different handlers based on pattern matching on the request path. It also enables you to extract values from the path and use them as parameters in the request.

This is particularly useful when developing REST-style web applications.

To do this you simply create an instance of `vertx.RouteMatcher` and use it as handler in an HTTP server. See the chapter on HTTP servers for more information on setting HTTP handlers. Here's an example:

    var server = vertx.createHttpServer();
    
    var routeMatcher = new vertx.RouteMatcher();
        
    server.requestHandler(routeMatcher).listen(8080, 'localhost');
    
## Specifying matches.    
    
You can then add different matches to the route matcher. For example, to send all GET requests with path `/animals/dogs` to one handler and all GET requests with path `/animals/cats` to another handler you would do:

    var server = vertx.createHttpServer();
    
    var routeMatcher = new vertx.RouteMatcher();
    
    routeMatcher.get('/animals/dogs', function(req) {
        req.response.end('You requested dogs');
    });
    
    routeMatcher.get('/animals/cats', function(req) {
        req.response.end('You requested cats');    
    });
        
    server.requestHandler(routeMatcher).listen(8080, 'localhost');
    
Corresponding methods exist for each HTTP method - `get`, `post`, `put`, `delete`, `head`, `options`, `trace`, `connect` and `patch`.

There's also an `all` method which applies the match to any HTTP request method.

The handler specified to the method is just a normal HTTP server request handler, the same as you would supply to the `requestHandler` method of the HTTP server.

You can provide as many matches as you like and they are evaluated in the order you added them, the first matching one will receive the request.

A request is sent to at most one handler.

## Extracting parameters from the path

If you want to extract parameters from the path, you can do this too, by using the `:` (colon) character to denote the name of a parameter. For example:

    var server = vertx.createHttpServer();
    
    var routeMatcher = new vertx.RouteMatcher();
    
    routeMatcher.put('/:blogname/:post', function(req) {        
        var blogName = req.params().get('blogname');
        var post = req.params().get('post');
        req.response.end('blogname is ' + blogName + ', post is ' + post);
    });
    
    server.requestHandler(routeMatcher).listen(8080, 'localhost');
    
Any params extracted by pattern matching are added to the map of request parameters.

In the above example, a PUT request to `/myblog/post1` would result in the variable `blogName` getting the value `myblog` and the variable `post` getting the value `post1`.

Valid parameter names must start with a letter of the alphabet and be followed by any letters of the alphabet or digits or the underscore character.

## Extracting params using Regular Expressions

Regular Expressions can be used to extract more complex matches. In this case capture groups are used to capture any parameters.

Since the capture groups are not named they are added to the request with names `param0`, `param1`, `param2`, etc. 

Corresponding functions exist for each HTTP method - `getWithRegEx`, `postWithRegEx`, `putWithRegEx`, `deleteWithRegEx`, `headWithRegEx`, `optionsWithRegEx`, `traceWithRegEx`, `connectWithRegEx` and `patchWithRegEx`.

There's also an `allWithRegEx` function which applies the match to any HTTP request method.

For example:

    var server = vertx.createHttpServer();
    
    var routeMatcher = new vertx.RouteMatcher();

    routeMatcher.allWithRegEx('\/([^\/]+)\/([^\/]+)', function(req) {        
        var first = req.params().get('param0');
        var second = req.params().get('param1');
        req.response.end("first is " + first + " and second is " + second);
    });

    server.requestHandler(routeMatcher).listen(8080, 'localhost');
    
Run the above and point your browser at `http://localhost:8080/animals/cats`.

It will display 'first is animals and second is cats'.         

## Handling requests where nothing matches

You can use the `noMatch` method to specify a handler that will be called if nothing matches. If you don't specify a no match handler and nothing matches, a 404 will be returned.

    routeMatcher.noMatch(function(req) {
        req.response.end('Nothing matched');
    });
    
# WebSockets

[WebSockets](http://en.wikipedia.org/wiki/WebSocket) are a web technology that allows a full duplex socket-like connection between HTTP servers and HTTP clients (typically browsers).

## WebSockets on the server

To use WebSockets on the server you create an HTTP server as normal, but instead of setting a `requestHandler` you set a `websocketHandler` on the server.

    var server = vertx.createHttpServer();

    server.websocketHandler(function(websocket) {
      
      // A WebSocket has connected!
      
    }).listen(8080, 'localhost');

    
### Reading from and Writing to WebSockets    
    
The `websocket` instance passed into the handler implements both `ReadStream` and `WriteStream`, so you can read and write data to it in the normal ways. I.e by setting a `dataHandler` and calling the `write` method.

See the chapter on [streams and pumps](#flow-control) for more information.

For example, to echo all data received on a WebSocket:

    var server = vertx.createHttpServer();

    server.websocketHandler(function(websocket) {
      
      new Pump(websocket, websocket).start();

    }).listen(8080, 'localhost');
    
The `websocket` instance also has method `writeBinaryFrame` for writing binary data. This has the same effect as calling `write`.

Another method `writeTextFrame` also exists for writing text data. This is equivalent to calling 

    websocket.write(new vertx.Buffer('some-string'));    

### Rejecting WebSockets

Sometimes you may only want to accept WebSockets which connect at a specific path.

To check the path, you can query the `path()` function of the websocket. You can then call the `reject` function to reject the websocket.

    var server = vertx.createHttpServer();

    server.websocketHandler(function(websocket) {
      
      if (websocket.path() === '/services/echo') {
        new vertx.Pump(websocket, websocket).start();
      } else {
        websocket.reject();
      }        
    }).listen(8080, 'localhost'); 

### Headers on the websocket

You can use the `headers()` method to retrieve the headers passed in the Http Request from the client that caused the upgrade to websockets.    
    
## WebSockets on the HTTP client

To use WebSockets from the HTTP client, you create the HTTP client as normal, then call the `connectWebsocket` function, passing in the URI that you wish to connect to at the server, and a handler.

The handler will then get called if the WebSocket successfully connects. If the WebSocket does not connect - perhaps the server rejects it - then any exception handler on the HTTP client will be called.

    var client = vertx.createHttpClient().host("foo.com");
    
    client.connectWebsocket('/some-uri', function(websocket) {
      
      // WebSocket has connected!
      
    }); 

Note that the host (and port) is set on the `HttpClient` instance, and the uri passed in the connect is typically a *relative* URI.
    
Again, the client side WebSocket implements `ReadStream` and `WriteStream`, so you can read and write to it in the same way as any other stream object. 

## WebSockets in the browser

To use WebSockets from a compliant browser, you use the standard WebSocket API. Here's some example client side JavaScript which uses a WebSocket. 

    <script>
    
        var socket = new WebSocket("ws://foo.com/services/echo");

        socket.onmessage = function(event) {
            alert("Received data from websocket: " + event.data);
        }
        
        socket.onopen = function(event) {
            alert("Web Socket opened");
            socket.send("Hello World");
        };
        
        socket.onclose = function(event) {
            alert("Web Socket closed");
        };
    
    </script>
    
For more information see the [WebSocket API documentation](http://dev.w3.org/html5/websockets/) 

# SockJS

WebSockets are a new technology, and many users are still using browsers that do not support them, or which support older, pre-final, versions.

Moreover, WebSockets do not work well with many corporate proxies. This means that's it's not possible to guarantee a WebSockets connection is going to succeed for every user.

Enter SockJS.

SockJS is a client side JavaScript library and protocol which provides a simple WebSocket-like interface to the client side JavaScript developer irrespective of whether the actual browser or network will allow real WebSockets.

It does this by supporting various different transports between browser and server, and choosing one at runtime according to browser and network capabilities. All this is transparent to you - you are simply presented with the WebSocket-like interface which *just works*.

Please see the [SockJS website](https://github.com/sockjs/sockjs-client) for more information.

## SockJS Server

Vert.x provides a complete server side SockJS implementation.

This enables Vert.x to be used for modern, so-called *real-time* (this is the *modern* meaning of *real-time*, not to be confused by the more formal pre-existing definitions of soft and hard real-time systems) web applications that push data to and from rich client-side JavaScript applications, without having to worry about the details of the transport.

To create a SockJS server you simply create a HTTP server as normal and then call the `createSockJSServer` method of your `vertx` instance passing in the Http server:

    var httpServer = vertx.createHttpServer();
    
    var sockJSServer = vertx.createSockJSServer(httpServer);
    
Each SockJS server can host multiple *applications*.

Each application is defined by some configuration, and provides a handler which gets called when incoming SockJS connections arrive at the server.      

For example, to create a SockJS echo application:

    var httpServer = vertx.createHttpServer();
    
    var sockJSServer = vertx.createSockJSServer(httpServer);
    
    var config = { prefix: '/echo' };
    
    sockJSServer.installApp(config, function(sock) {
    
        new vertx.Pump(sock, sock).start();
        
    });
    
    httpServer.listen(8080);
    
The configuration is an instance of `org.vertx.java.core.json.JsonObject`, which takes the following fields:

* `prefix`: A url prefix for the application. All http requests whose paths begins with selected prefix will be handled by the application. This property is mandatory.
* `insert_JSESSIONID`: Some hosting providers enable sticky sessions only to requests that have JSESSIONID cookie set. This setting controls if the server should set this cookie to a dummy value. By default setting JSESSIONID cookie is enabled. More sophisticated beaviour can be achieved by supplying a function.
* `session_timeout`: The server sends a `close` event when a client receiving connection have not been seen for a while. This delay is configured by this setting. By default the `close` event will be emitted when a receiving connection wasn't seen for 5 seconds.
* `heartbeat_period`: In order to keep proxies and load balancers from closing long running http requests we need to pretend that the connecion is active and send a heartbeat packet once in a while. This setting controlls how often this is done. By default a heartbeat packet is sent every 5 seconds.
* `max_bytes_streaming`: Most streaming transports save responses on the client side and don't free memory used by delivered messages. Such transports need to be garbage-collected once in a while. `max_bytes_streaming` sets a minimum number of bytes that can be send over a single http streaming request before it will be closed. After that client needs to open new request. Setting this value to one effectively disables streaming and will make streaming transports to behave like polling transports. The default value is 128K.    
* `library_url`: Transports which don't support cross-domain communication natively ('eventsource' to name one) use an iframe trick. A simple page is served from the SockJS server (using its foreign domain) and is placed in an invisible iframe. Code run from this iframe doesn't need to worry about cross-domain issues, as it's being run from domain local to the SockJS server. This iframe also does need to load SockJS javascript client library, and this option lets you specify its url (if you're unsure, point it to the latest minified SockJS client release, this is the default). The default value is `http://cdn.sockjs.org/sockjs-0.3.4.min.js`

## Reading and writing data from a SockJS server

The `SockJSSocket` object passed into the SockJS handler implements `ReadStream` and `WriteStream` much like `NetSocket` or `WebSocket`. You can therefore use the standard API for reading and writing to the SockJS socket or using it in pumps.

See the chapter on [Streams and Pumps](#flow-control) for more information.
    
## SockJS client

For full information on using the SockJS client library please see the SockJS website. A simple example:

    <script>
       var sock = new SockJS('http://mydomain.com/my_prefix');
       
       sock.onopen = function() {
           console.log('open');
       };
       
       sock.onmessage = function(e) {
           console.log('message', e.data);
       };
       
       sock.onclose = function() {
           console.log('close');
       };
    </script>   
    
As you can see the API is very similar to the WebSockets API.    
            
# SockJS - EventBus Bridge

## Setting up the Bridge

By connecting up SockJS and the Vert.x event bus we create a distributed event bus which not only spans multiple Vert.x instances on the server side, but can also include client side JavaScript running in browsers.

We can therefore create a huge distributed bus encompassing many browsers and servers. The browsers don't have to be connected to the same server as long as the servers are connected.

On the server side we have already discussed the event bus API.

We also provide a client side JavaScript library called `vertxbus.js` which provides the same event bus API, but on the client side.

This library internally uses SockJS to send and receive data to a SockJS Vert.x server called the SockJS bridge. It's the bridge's responsibility to bridge data between SockJS sockets and the event bus on the server side.

Creating a Sock JS bridge is simple. You just call the `bridge` method on the SockJS server.

You will also need to secure the bridge (see below).

The following example bridges the event bus to client side JavaScript:

    var httpServer = vertx.createHttpServer();
    
    var sockJSServer = vertx.createSockJSServer(httpServer);

    sockJSServer.bridge({prefix : '/eventbus'}, [], [] );

    httpServer.listen(8080);
    
## Using the Event Bus from client side JavaScript

Once you've set up a bridge, you can use the event bus from the client side as follows:

In your web page, you need to load the script `vertxbus.js`, then you can access the Vert.x event bus API. Here's a rough idea of how to use it. For a full working examples, please consult the vert.x examples.

    <script src="http://cdn.sockjs.org/sockjs-0.3.4.min.js"></script>
    <script src='vertxbus.js'></script>

    <script>

        var eb = new vertx.EventBus('http://localhost:8080/eventbus');
        
        eb.onopen = function() {
        
          eb.registerHandler('some-address', function(message) {

            console.log('received a message: ' + JSON.stringify(message);

          });

          eb.send('some-address', {name: 'tim', age: 587});
        
        }
       
    </script>

You can find `vertxbus.js` in the `client` directory of the Vert.x distribution.

The first thing the example does is to create a instance of the event bus

    var eb = new vertx.EventBus('http://localhost:8080/eventbus'); 
    
The parameter to the constructor is the URI where to connect to the event bus. Since we create our bridge with the prefix `eventbus` we will connect there.

You can't actually do anything with the bridge until it is opened. When it is open the `onopen` handler will be called.

The client side event bus API for registering and unregistering handlers and for sending messages is the same as the server side one. Please consult the chapter on the event bus for full information.    

**There is one more thing to do before getting this working, please read the following section....**

## Securing the Bridge

If you started a bridge like in the above example without securing it, and attempted to send messages through it you'd find that the messages mysteriously disappeared. What happened to them?

For most applications you probably don't want client side JavaScript being able to send just any message to any verticle on the server side or to all other browsers.

For example, you may have a persistor verticle on the event bus which allows data to be accessed or deleted. We don't want badly behaved or malicious clients being able to delete all the data in your database! Also, we don't necessarily want any client to be able to listen in on any topic.

To deal with this, a SockJS bridge will, by default refuse to let through any messages. It's up to you to tell the bridge what messages are ok for it to pass through. (There is an exception for reply messages which are always allowed through).

In other words the bridge acts like a kind of firewall which has a default *deny-all* policy.

Configuring the bridge to tell it what messages it should pass through is easy. You pass in two Json arrays that represent *matches*, as arguments to `bridge`.

The first array is the *inbound* list and represents the messages that you want to allow through from the client to the server. The second array is the *outbound* list and represents the messages that you want to allow through from the server to the client.

Each match can have up to three fields:

1. `address`: This represents the exact address the message is being sent to. If you want to filter messages based on an exact address you use this field.
2. `address_re`: This is a regular expression that will be matched against the address. If you want to filter messages based on a regular expression you use this field. If the `address` field is specified this field will be ignored.
3. `match`: This allows you to filter messages based on their structure. Any fields in the match must exist in the message with the same values for them to be passed. This currently only works with JSON messages.

When a message arrives at the bridge, it will look through the available permitted entries.

* If an `address` field has been specified then the `address` must match exactly with the address of the message for it to be considered matched.

* If an `address` field has not been specified and an `address_re` field has been specified then the regular expression in `address_re` must match with the address of the message for it to be considered matched.

* If a `match` field has been specified, then also the structure of the message must match.

Here is an example:

    var httpServer = vertx.createHttpServer();
    
    var sockJSServer = vertx.createSockJSServer(httpServer);

    sockJSServer.bridge({prefix : '/eventbus'},
      [
        // Let through any messages sent to 'demo.orderMgr'
        {
          address : 'demo.orderMgr'
        },
        // Allow calls to the address 'demo.persistor' as long as the messages
        // have an action field with value 'find' and a collection field with value
        // 'albums'
        {
          address : 'demo.persistor',
          match : {
            action : 'find',
            collection : 'albums'
          }
        },
        // Allow through any message with a field `wibble` with value `foo`.
        {
          match : {
            wibble: 'foo'
          }
        }
      ],
      [
        // Let through any messages coming from address 'ticker.mystock'
        {
          address : 'ticker.mystock'
        },
        // Let through any messages from addresses starting with "news." (e.g. news.europe, news.usa, etc)
        {
          address_re : 'news\\..+'
        }
      ]
      );


    httpServer.listen(8080);
   
    
To let all messages through you can specify two JSON array with a single empty JSON object which will match all messages.

    ...

    sockJSServer.bridge({prefix : '/eventbus'}, [{}], [{}]);
    
    ... 
     
**Be very careful!**

## Messages that require authorisation

The bridge can also refuse to let certain messages through if the user is not authorised.

To enable this you need to make sure an instance of the `vertx.auth-mgr` module is available on the event bus. (Please see the modules manual for a full description of modules).

To tell the bridge that certain messages require authorisation before being passed, you add the field `requires_auth` with the value of `true` in the match. The default value is `false`. For example, the following match:

    {
      address : 'demo.persistor',
      match : {
        action : 'find',
        collection : 'albums'
      },
      requires_auth: true
    }
    
This tells the bridge that any messages to save orders in the `orders` collection, will only be passed if the user is successful authenticated (i.e. logged in ok) first.    
       
# File System

Vert.x lets you manipulate files on the file system. File system operations are asynchronous and take a handler function as the last argument. This function will be called when the operation is complete, or an error has occurred.
The first argument passed into the callback is an exception, if an error occurred. This will be `null` if the operation completed successfully. If the operation returns a result that will be passed in the second argument to the handler.

## Synchronous forms

For convenience, we also provide synchronous forms of most operations. It's highly recommended the asynchronous forms are always used for real applications.

The synchronous form does not take a handler as an argument and returns its results directly. The name of the synchronous function is the same as the name as the asynchronous form with `Sync` appended.

## copy

Copies a file.

This function can be called in two different ways:

* `copy(source, destination, handler)`

Non recursive file copy. `source` is the source file name. `destination` is the destination file name.

Here's an example:

    vertx.fileSystem.copy('foo.dat', 'bar.dat', function(err) {
        if (!err) {
            console.log('Copy was successful');
        }
    });


* `copy(source, destination, recursive, handler)`

Recursive copy. `source` is the source file name. `destination` is the destination file name. `recursive` is a boolean flag - if `true` and source is a directory, then a recursive copy of the directory and all its contents will be attempted.

## move

Moves a file.

`move(source, destination, handler)`

`source` is the source file name. `destination` is the destination file name.

## truncate

Truncates a file.

`truncate(file, len, handler)`

`file` is the file name of the file to truncate. `len` is the length in bytes to truncate it to.

## chmod

Changes permissions on a file or directory.

This function can be called in two different ways:

* `chmod(file, perms, handler)`.

Change permissions on a file.

`file` is the file name. `perms` is a Unix style permissions string made up of 9 characters. The first three are the owner's permissions. The second three are the group's permissions and the third three are others permissions. In each group of three if the first character is `r` then it represents a read permission. If the second character is `w`  it represents write permission. If the third character is `x` it represents execute permission. If the entity does not have the permission the letter is replaced with `-`. Some examples:

    rwxr-xr-x
    r--r--r--
  
* `chmod(file, perms, dirPerms, handler)`.  

Recursively change permissions on a directory. `file` is the directory name. `perms` is a Unix style permissions to apply recursively to any files in the directory. `dirPerms` is a Unix style permissions string to apply to the directory and any other child directories recursively.

## props

Retrieve properties of a file.

`props(file, handler)`

`file` is the file name. The props are returned in the handler. The results is an object with the following properties:

* `creationTime`. Time of file creation.
* `lastAccessTime`. Time of last file access.
* `lastModifiedTime`. Time file was last modified.
* `isDirectory`. This will have the value `true` if the file is a directory.
* `isRegularFile`. This will have the value `true` if the file is a regular file (not symlink or directory).
* `isSymbolicLink`. This will have the value `true` if the file is a symbolic link.
* `isOther`. This will have the value `true` if the file is another type.

Here's an example:

    vertx.fileSystem.props('some-file.txt', function(err, props) {
        if (err) {
            console.log('Failed to retrieve file props: ' + err);
        } else {
            console.log('File props are:');
            console.log('Last accessed: ' + props.lastAccessTime);
            // etc 
        }
    }); 

## lprops

Retrieve properties of a link. This is like `props` but should be used when you want to retrieve properties of a link itself without following it.

It takes the same arguments and provides the same results as `props`.

## link

Create a hard link.

`link(link, existing, handler)`

`link` is the name of the link. `existing` is the existing file (i.e. where to point the link at).

## symlink

Create a symbolic link.

`symlink(link, existing, handler)`

`link` is the name of the symlink. `existing` is the existing file (i.e. where to point the symlink at).

## unlink

Unlink (delete) a link.

`unlink(link, handler)`

`link` is the name of the link to unlink.

## readSymLink

Reads a symbolic link. I.e returns the path representing the file that the symbolic link specified by `link` points to.

`readSymLink(link, handler)`

`link` is the name of the link to read. An usage example would be:

    vertx.fileSystem.readSymLink('somelink', function(err, res) {
        if (!err) {
            console.log('Link points at ' + res);
        }
    });
  
## delete

Deletes a file or recursively deletes a directory.

This function can be called in two ways:

* `delete(file, handler)`

Deletes a file. `file` is the file name.

* `delete(file, recursive, handler)`

If `recursive` is `true`, it deletes a directory with name `file`, recursively. Otherwise it just deletes a file.

## mkdir

Creates a directory.

This function can be called in three ways:

* `mkdir(dirname, handler)`

Makes a new empty directory with name `dirname`, and default permissions `

* `mkdir(dirname, createParents, handler)`

If `createParents` is `true`, this creates a new directory and creates any of its parents too. Here's an example
    
    vertx.fileSystem.mkdir('a/b/c', true, function(err, res) {
       if (!err) {
         console.log('Directory created ok');
       }
    });
  
* `mkdir(dirname, createParents, perms, handler)`

Like `mkdir(dirname, createParents, handler)`, but also allows permissions for the newly created director(ies) to be specified. `perms` is a Unix style permissions string as explained earlier.

## readDir

Reads a directory. I.e. lists the contents of the directory.

This function can be called in two ways:

* `readDir(dirName)`

Lists the contents of a directory

* `readDir(dirName, filter)`

List only the contents of a directory which match the filter. Here's an example which only lists files with an extension `txt` in a directory.

    vertx.fileSystem.readDir('mydirectory', '.*\.txt', function(err, res) {
      if (!err) {
        console.log('Directory contains these .txt files');
        for (var i = 0; i < res.length; i++) {
          console.log(res[i]);  
        }
      }
    });
    
The filter is a regular expression.    
  
## readFile

Read the entire contents of a file in one go. *Be careful if using this with large files since the entire file will be stored in memory at once*.

`readFile(file)`. Where `file` is the file name of the file to read.

The body of the file will be returned as a `Buffer` in the handler.

Here is an example:

    vertx.fileSystem.readFile('myfile.dat', function(err, res) {
        if (!err) {
            console.log('File contains: ' + res.length() + ' bytes');
        }
    });

## writeFile

Writes an entire `Buffer` or a string into a new file on disk.

`writeFile(file, data, handler)` Where `file` is the file name. `data` is a `Buffer` or string.

## createFile

Creates a new empty file.

`createFile(file, handler)`. Where `file` is the file name.

## exists

Checks if a file exists.

`exists(file, handler)`. Where `file` is the file name.

The result is returned in the handler.

    vertx.fileSystem.exists('some-file.txt', function(err, res) {
        if (!err) {
            console.log('File ' + (res ? 'exists' : 'does not exist'));
        }
    });

## fsProps

Get properties for the file system.

`fsProps(file, handler)`. Where `file` is any file on the file system.

The result is returned in the handler. The result object has the following fields:

* `totalSpace`. Total space on the file system in bytes.
* `unallocatedSpace`. Unallocated space on the file system in bytes.
* `usableSpace`. Usable space on the file system in bytes.

Here is an example:

    vertx.fileSystem.fsProps('mydir', function(err, res) {
        if (!err) {
            console.log('total space: ' + res.totalSpace);
            // etc
        }
    });


## open

Opens an asynchronous file for reading \ writing.

This function can be called in four different ways:

* `open(file, handler)`

Opens a file for reading and writing. `file` is the file name. It creates it if it does not already exist.

* `open(file, openFlags, handler)`

Opens a file using the specified open flags. `file` is the file name. `openFlags` is an integer representing whether to open the flag for reading or writing and whether to create it if it doesn't already exist.

`openFlags` is constructed from a combination of these three constants.

    vertx.fileSystem.OPEN_READ = 1
    vertx.fileSystem.OPEN_WRITE = 2
    vertx.fileSystem.CREATE_NEW = 4
  
For example:

    // Open for reading only
    var flags = vertx.FileSystem.OPEN_READ;
  
     // Open for reading and writing
    var flags = vertx.FileSystem.OPEN_READ | vertx.FileSystem.OPEN_WRITE;
  
When the file is opened, an instance of `AsyncFile` is passed into the result handler:

    vertx.fileSystem.open('some-file.dat', vertx.FileSystem.OPEN_READ | vertx.FileSystem.OPEN_WRITE,
        function(err, asyncFile) {
            if (err) {
                console.log('Failed to open file ' + err);
            } else {
                console.log('File opened ok');
                asyncFile.close(); // Close it    
            }
        });    
        
* `open(file, openFlags, flush, handler)`

This is the same as `open(file, openFlags, handler)` but you can also specify whether any file write are flushed immediately to disk (sync'd).

Default is `flush = false`, so writes are just written into the OS cache.

* `open(file, openFlags, flush, perms, handler)`

This is the same as `open(file, openFlags, flush, handler)` but you can also specify the file permissions to give the file if it is created. Permissions is a Unix-style permissions string as explained earlier in the chapter.


## AsyncFile

Instances of `AsyncFile` are returned from calls to `open` and you use them to read from and write to files asynchronously. They allow asynchronous random file access.

AsyncFile implements `ReadStream` and `WriteStream`, so you can pump files to and from other stream objects such as net sockets, HTTP requests and responses, and WebSockets.

They also allow you to read and write directly to them.

### Random access writes

To use an AsyncFile for random access writing you use the `write` method.

`write(buffer, position, handler)`.

The parameters to the method are: 

* `buffer`: the buffer to write.
* `position`: an integer position in the file where to write the buffer. If the position is greater or equal to the size of the file, the file will be enlarged to accomodate the offset.

Here is an example of random access writes:

    vertx.fileSystem.open('some-file.dat', function(err, asyncFile) {
            if (err) {
                console.log('Failed to open file ' + err);
            } else {
                // File open, write a buffer 5 times into a file              
                var buff = new vertx.Buffer('foo');
                for (var i = 0; i < 5; i++) {
                    asyncFile.write(buff, buff.length() * i, function(err) {
                        if (err) {
                            console.log('Failed to write ' + err);
                        } else {
                            console.log('Written ok');
                        }
                    });    
                }
            }
        });   

### Random access reads

To use an AsyncFile for random access reads you use the `read` method.

`read(buffer, offset, position, length, handler)`.

The parameters to the method are: 

* `buffer`: the buffer into which the data will be read.
* `offset`: an integer offset into the buffer where the read data will be placed.
* `position`: the position in the file where to read data from.
* `length`: the number of bytes of data to read

Here's an example of random access reads:

    vertx.fileSystem.open('some-file.dat', function(err, asyncFile) {
        if (err) {
            console.log('Failed to open file ' + err);
        } else {                   
            var buff = new vertx.Buffer(1000);
            for (var i = 0; i < 10; i++) {
                asyncFile.read(buff, i * 100, i * 100, 100, function(err) {
                    if (err) {
                        console.log('Failed to read ' + err);
                    } else {
                        console.log('Read ok');
                    }
                });    
            }
        }
    });  

If you attempt to read past the end of file, the read will not fail but it will simply read zero bytes. 
    
### Flushing data to underlying storage.

If the AsyncFile was not opened with `flush = true`, then you can manually flush any writes from the OS cache by calling the `flush` function.

### Using AsyncFile as `ReadStream` and `WriteStream`

You can then use `AsyncFile` with a pump to pump data to and from other read and write streams.

Here's an example of pumping data from a file on a client to a HTTP request:

    var client = new vertx.HttpClient().host('foo.com');
    
    vertx.fileSystem.open('some-file.dat', function(err, asyncFile) {
        if (err) {
            console.log('Failed to open file ' + err);
        } else {                   
            var request = client.put('/uploads', function(resp) {
                console.log('resp status code ' + resp.statusCode());
            });            
            new vertx.Pump(asyncFile, request).start();            
            asyncFile.endHandler(function() {
                // File sent, end HTTP requuest
                request.end();
            });
            
        }
    });   
    
### Closing an AsyncFile

To close an AsyncFile call the `close` function. Closing is asynchronous and if you want to be notified when the close has been completed you can specify a handler function as an argument to `close`.


# DNS Client

Often you will find yourself in situations where you need to obtain DNS
information in an asynchronous fashion. Unfortunately this is not possible with
the API that is shipped with Java itself. Because of this Vert.x offers its
own API for DNS resolution which is fully asynchronous.

Obtain a `DnsClient` object by requring the `vertx/dns` module. You can ask
Vertx to create the client for you, or you can simply instantiate a new one
with the `DnsClient` constructor function.

    var dns    = require('vertx/dns');
    var client = dns.createDnsClient('8.8.8.8', '8.8.4.4');

    // The constructor can be used as well
    client = new dns.DnsClient('8.8.8.8', '8.8.4.4');


Be aware that you can pass in an array of address strings to
specifiy more then one DNS server to query for DNS resolution. The DNS
servers will be queried in the same order as specified here. Upon failure of
one, the next will be used.

## lookup

Try to lookup the A (IPv4) or AAAA (ipv6) record for a given name. The first
which is returned will be used, so it behaves the same way as you may be used
from when using "nslookup" on your OS.
    
To lookup the A / AAAA record for "vertx.io" you would typically use it like:

    client.lookup('vertx.io', function(err, result) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( result );
        }
    });

Be aware that the handler function may provide either an IPv4 or IPv6
string depending if an A or AAAA record was resolved.


## lookup4

Try to lookup the A (IPv4) record for a given name. The first which is returned
will be used, so it behaves the same way as you may be used from when using
"nslookup" on your OS.
    
To lookup the A record for "vertx.io" you would typically use it like:

    client.lookup4('vertx.io', function(err, result) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( result );
        }
    });
 
The handler function result will be the first address received, provided as an
IPv4 string address.
 

## lookup6

Try to lookup the AAAA (ipv6) record for a given name. The first which is
returned will be used, so it behaves the same way as you may be used from when
using "nslookup" on your OS.
    
To lookup the AAAA record for "vertx.io" you would typically use it like:

    client.lookup6('vertx.io', function(err, result) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( result );
        }
    });
 
The handler function result will be the first address received, provided as an
IPv6 string address.


## resolveA

Try to resolve all A (IPv4) records for a given name. This is quite similar to
using "dig" on unix like OSs.
    
To lookup all the A records for "vertx.io" you would typically do:

    client.resolveA('vertx.io', function(err, records) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( records.toString() );
        }
    });

The handler function will be provided an array of IPv4 address strings.



## resolveAAAA

Try to resolve all AAAA (IPv6) records for a given name. This is quite similar
to using "dig" on unix like OSs.
    
To lookup all the AAAAA records for "vertx.io" you would typically do:

    client.resolveAAAA('vertx.io', function(err, records) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( records.toString() );
        }
    });

The handler function will be provided an array of IPv6 address strings.


## resolveCNAME

Try to resolve all CNAME records for a given name. This is quite similar to
using "dig" on unix like OSs.
    
To lookup all the CNAME records for "vertx.io" you would typically do:

    client.resolveCNAME('vertx.io', function(err, records) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( records.toString() );
        }
    });

The handler function will be provided an array of host name strings.

## resolveMX

Try to resolve all MX records for a given name. The MX records are used to
define which Mail-Server accepts emails for a given domain.
    
To lookup all the MX records for "vertx.io" you would typically do:

    client.resolveMX('vertx.io', function(err, records) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            for (i=0; i<records.length; i++) {
              var record = records[i];
              console.log( record.name + " " + record.priority );
            }
        }
    });

The result handler will be provided with an array of MxRecords sorted by
priority, with lowest priority numbers first. E.g. record.priority of 1
comes before record.priority of 2 in the list.

The MxRecord allows you to access the priority and the name of the record 
as object properties.

    record = records[0]
    record.priority
    record.name


## resolveTXT

Try to resolve all TXT records for a given name. TXT records are often used to
define extra information for a domain.
    
To resolve all the TXT records for "vertx.io" you could use something along these lines:

    client.resolveTXT('vertx.io', function(err, records) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( records.toString() );
        }
    });

The handler function receives an array of strings.

## resolveNS

Try to resolve all NS records for a given name. The NS records specify which
DNS Server hosts the DNS information for a given domain.
    
To resolve all the NS records for "vertx.io" you could use something along these lines:

    client.resolveNS('vertx.io', function(err, records) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( records.toString() );
        }
    });

The handler function receives an array of string addresses.

## resolveSRV

Try to resolve all SRV records for a given name. The SRV records are used to
define extra information like port and hostname of services. Some protocols
need this extra information.
    
To lookup all the SRV records for "vertx.io" you would typically do:

    client.resolveNS('vertx.io', function(err, records) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( records.toString() );
        }
    });

The handler function will receiven an array of SRVRecord objects sorted by priority (smallest priority number first).

The SrvRecord allows you to access all information contained in the SRV record itself:

    record = ...
    record.priority
    record.name
    record.priority
    record.weight
    record.port
    record.protocol
    record.service
    record.target


## resolvePTR

Try to resolve the PTR record for a given name. The PTR record maps an
ipaddress to a name.
    
To resolve the PTR record for the ipaddress 10.0.0.1 you would use the PTR
notion of "1.0.0.10.in-addr.arpa"

    client = dns.createDnsClient('1.0.0.10.in-addr.arpa')
    client.resolvePTR('10.0.0.1', function( err, result ) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( result );
        }
    });

The handler function is provided a a name string when it is called.

## reverseLookup

Try to do a reverse lookup for an ipaddress. This is basically the same as
resolving a PTR record, but allows you to just pass in the ipaddress and not a
valid PTR query string.

To do a reverse lookup for the ipaddress 10.0.0.1 do something like this:

    client.reverseLookup('10.0.0.1', function( err, result ) {
        if (err != null) {
            console.log( "Failed to resolve entry " + err );
        } else {
            console.log( result );
        }
    });

The handler function is provided a a name string when it is called.


## Error handling
As you saw in previous sections the `DnsClient` allows you to pass in a handler
function which is notified once the query has completed. In case of an error it
will be notified with `a DnsException` which will hold a `DnsResponseCode` that
indicates why the resolution failed. This `DnsResponseCode` can be used to
inspect the cause in more detail.

Possible `DnsResponseCode`s are:

### NOERROR
No record was found for a given query

### FORMERROR
Format error 

### SERVFAIL
Server failure

### NXDOMAIN
Name error

### NOTIMPL
Not implemented by DNS Server

### REFUSED
DNS Server refused the query

### YXDOMAIN
Domain name should not exist

### YXRRSET
Resource record should not exist

### NXRRSET
RRSET does not exist

### NOTZONE
Name not in zone

### BADVER
Bad extension mechanism for version

### BADSIG
Bad signature

### BADKEY
Bad key

### BADTIME
Bad timestamp

All of those errors are generated by the DNS Server itself.

The DNS response code will be provided as a 
You can obtain the DnsResponseCode from the DnsException like:

    client.lookup('not.exist.vertx.io', function(err, result) {
        if (err != null && err instanceof org.vertx.java.core.dns.DnsException) {
          var exceptionCode = err.code();
          // ... etc.
        } else {
          console.log( result );
        }
    });







