/*
# Copyright 2018 Salesforce.com All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
*/

'use strict';

const _ = require('lodash');
var JSONbig = require('json-bigint');  // standard JSON library cannot handle size of twitter ID values
const fs = require('fs');
const express = require('express');
const path = require('path');
const Kafka = require('no-kafka');
const consumerTopic = process.env.KAFKA_TOPIC;
var nforce = require('nforce');

var Promise = require('bluebird');
//require('./lib/hbsHelpers');

var app = express();
//var server = require('http').createServer(app);
//var io = require('socket.io')(server);
//var bodyParser = require('body-parser');

/*
 * Data handler for consumer
 *
 * Read each topic message and send it out to a platform event*/

const dataHandler = function (messageSet, topic, partition) {
    messageSet.forEach(function (m) {
        //messageCount++;
        console.log('***sfdc publisher invoked***');
        //const msg = JSONbig.parse(m.message.value.toString('utf8')).payload;
        //console.log('topic message received - '+ m.message.value.toString('utf8'));
        //var jsonContent = JSON.parse(m.message.value.toString('utf8'));
        // Get Value from JSON
        //console.log("Contact Id:", jsonContent.Contact_Id__c);
        //console.log("Status:", jsonContent.Status__c);
        //console.log("Reason:", jsonContent.Reason__c);
        console.log("Message:", m.message.value.toString('utf8'));

        var jsonContent = JSON.parse(m.message.value.toString('utf8'));
        console.log("Contact Id:", jsonContent.Contact_Id__c);
        console.log("Status:", jsonContent.Status__c);
        console.log("Reason:", jsonContent.Reason__c);

        const contactId = jsonContent.Contact_Id__c;
        const status = jsonContent.Status__c;
        const reason = jsonContent.Reason__c;

        //Platform event code goes here
        var org = nforce.createConnection({
            environment: 'production',
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            //apiVersion: 'v32.0',  // optional, defaults to current salesforce API version
            redirectUri: 'http://localhost:3000/oauth/_callback',
            mode: 'single' // optional, 'single' or 'multi' user mode, multi default
          });

          org.authenticate({ username: process.env.USERNAME, password: process.env.PASSWORD}, function(err, resp){  
            if(err) {
              console.log('####Error: ' + err.message);
            } else {
              console.log('####Access Token: ' + resp.access_token);

            
              let creditcheck = nforce.createSObject('credit_check__e');
              creditcheck.set('Contact_Id__c', contactId);
              creditcheck.set('Reason__c', reason);
              creditcheck.set('Status__c', status);
            
            

              org.insert({ sobject: creditcheck }, function(err, resp){
                if(err) {
                    console.log('####Error Inserting PE: ' + err.message);
                  } else {
                    console.log('####Worked: ');
                  }
              });

              //oauth = resp;
            }
          });

        console.log('***sfdc publisher complete***');

    });
};

// Check that required Kafka environment variables are defined
const cert = process.env.KAFKA_CLIENT_CERT;
const key  = process.env.KAFKA_CLIENT_CERT_KEY;
const url  = process.env.KAFKA_URL;
if (!cert) throw new Error('KAFKA_CLIENT_CERT environment variable must be defined.');
if (!key) throw new Error('KAFKA_CLIENT_CERT_KEY environment variable must be defined.');
if (!url) throw new Error('KAFKA_URL environment variable must be defined.');

// Write certs to disk because that's how no-kafka library needs them
fs.writeFileSync('./client.crt', process.env.KAFKA_CLIENT_CERT);
fs.writeFileSync('./client.key', process.env.KAFKA_CLIENT_CERT_KEY);

// Configure consumer client
const consumer = new Kafka.SimpleConsumer({
    idleTimeout: 1000,
    clientId: 'kafka-sfdc-publisher',
    connectionString: url.replace(/\+ssl/g,''),
    ssl: {
      certFile: './client.crt',
      keyFile: './client.key'
    }
});

/*
 * Startup cosumer,
 * followed by consumer of 'ingest' topic */

return consumer.init().then(function () {
    console.log('Consumer connected.');
    console.log('Consuming from topic: ', consumerTopic);
    return consumer.subscribe(consumerTopic, dataHandler);
});

