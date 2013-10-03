nodebuzz
========

A simple buzzer in node.js for multiple teams.

Each team can use a smartphone, placed on the team's table. Team members can buzz by hitting their table (which is detected by the accelerometer). When someone buzzes, a countdown is shown on all participating devices. A central monitor can show who buzzed and the countdown.


Setup
-----

Run `npm install` in `server`, start `node server.js` and direct clients to `client.html`, some device with a huge monitor to `monitor.html` and an administrative PC to `admin.html`.

Now, every client can buzz (by hitting the table their device is placed on), the central monitor will show who buzzed, and the admin can enable / disable buzzing, remote-buzz specific clients, and configure the countdown.


Limitations
-----------

* __Full of bugs.__ This project's core functionality was built in a day. Based on personal experience, it works in testing, and it _will_ break in production.
* __Deprecated from day 1.__ I don't intend to develop it any further. This is a snapshot of the project after the live event it was built for.
* Only seems to support iPhone or iPod touch with iOS 7 as a client.
* __No security whatsoever.__


Security
--------

There is no authentication whatsoever. If someone visits `admin.html`, he's an administrator. If someone sends packet to the server, they can do whatever they want to do. If someone sends strange packets to the server, the server will crash, probably allowing remote code execution.

Setting up this server on any network where you don't have full control over all hosts wouldn't be careless: _It would be plain stupid._

Please, either don't use the code (just the idea), or use a separate, protected network + expect it to break.