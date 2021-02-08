# Kafka Topics -> Salesforce Platform Events

This is a simple implementation in node that subscribes to a given kafka topic then creates a Platform Event in Salesforce. It demonstrates the ability to create microservices to filter, maintain replayid's that scale independently of the Salesforce core services. The service requires a managed kafka instance to be attached.

More info about Platform Events be found here:
[Platform Events Developer Guide](https://resources.docs.salesforce.com/212/latest/en-us/sfdc/pdf/platform_events.pdf)

More info about Heroku Kafka be found here:
[Apache Kafka on Heroku](https://www.heroku.com/kafka)

# Deploy to:
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

# What does the service do?
It uses a nodejs implementation to implement a worker dyno that subscribes to a Kafka Topic.
When a message is pushed into the topic an associated Salesforce Platform Event is created.

## License
See [LICENSE](LICENSE).

This is not an official Salesforce product.


