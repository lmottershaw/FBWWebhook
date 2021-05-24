const Crypto = require('crypto');
const request = require('request');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // Pre-load secrets from ENV
    APP_SECRET = process.env['APP_SECRET']
    VERIFY_TOKEN = process.env['VERIFY_TOKEN']
    ACCESS_TOKEN = process.env['ACCESS_TOKEN']

    switch (req.method) {
        case "GET":
            try {
                SubscribeWebHook();
            } catch (error) {
                console.error('Failed validation. Make sure the validation tokens match.');
                context.res = {status: 403}
            }
            break;

        case "POST":
            try {
                ProcessWebHook();
            } catch (error) {
                console.error(error)
            } finally {
                context.res = {status: 200}
            }
            break;

        default:
            context.log("Invalid request");
    }

    function SubscribeWebHook() {
        if ((!req.query['hub.mode'] || !req.query['hub.mode'] === "subscribe") || (!req.query['hub.verify_token'] || !req.query['hub.verify_token'] === VERIFY_TOKEN))
            throw "Invalid Subscribe Request."
            
        context.log('Validating Webhook')
        context.res = {
            status: 200,
            body: (req.query['hub.challenge'])
        }
    }

    function ProcessWebHook() {
        if (!req.body || !req.headers['x-hub-signature'])
            throw "Invalid request."
        
        if (req.body.object != "workplace_security")
            throw "Invalid payload."

        req.body.entry.forEach(function(entry) {
            let group_id = entry.id;
            entry.changes.forEach(function(change) {
                let json_res = { json: { event: change } };
                request.post("http://127.0.0.1:5000/", json_res, (error, res, body) => {
                    if (error) {
                        console.error(error);
                        return
                    }
                    console.log(`statusCode: ${res.statusCode}`);
                    console.log(body);
                });
                // console.log(JSON.stringify(json_res));
            });
        });
    }
}
