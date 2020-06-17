// var paypalFunction = function paypalFunction() {
//     return "Paypal not initialized";
// };

// //create client
// braintree.client.create({
//     authorization: window.ppToken
//   }, function (clientErr, clientInstance) {
//     // Create PayPal component
//     braintree.paypal.create({client: clientInstance}, function (err, paypalInstance) {
//         if(err){
//             console.log(err)
//         }
//         paypalFunction = function paypalFunction(id) {
//             paypalInstance.tokenize({
//                 flow: 'checkout', // Required
//                 intent: 'sale',
//                 amount: 25.00, // Required
//                 currency: 'USD', // Required
//                 locale: 'en_US',
//                 useraction: 'commit',
//                 enableShippingAddress: false,
//                 displayName: "Smithfield"
//             }, function (err, tokenizationPayload) {
//                 if(err){
//                     console.log("Error\n")
//                     console.log(err)
//                 }
//                 console.log(tokenizationPayload);
//                 if (tokenizationPayload && tokenizationPayload.nonce){
//                     var data = $("form.pp").serializeArray();
//                     data.push({name:"nonce",value: tokenizationPayload.nonce})
//                     data.push({name:"id",value: id})
//                     //console.log(data)
//                     $.ajax({
//                         type: "POST",
//                         url: '/committed-cooks-payment',
//                         data: data,
//                         cache: false,
//                         dataType:"json",
//                         success: function(data){
//                            console.log(data)
//                            window.location.href = "/committed-cooks-thanks";
//                         },
//                         done: function(data){
                          
//                         },
//                         error:function(error){
//                             alert("There was a problem with your submission, please try again.");
//                             console.log(error)
//                         }
//                       })
//                 }
//                 else {
//                     hideModal($("#loading"))
//                     alert("Please complete the PayPal transaction to complete your submission.");
//                 }
//             })
//         }//end paypalfunction
//     })//end braintree client create
// });//end client


var paypalFunction = function paypalFunction() {
    return "Paypal not initialized";
};

//create client
braintree.client.create({
    authorization: window.ppToken
  }, function (clientErr, clientInstance) {
    // Create PayPal component
    braintree.paypal.create({client: clientInstance}, function (err, paypalInstance) {
        if(err){
            console.log(err)
        }
        paypalFunction = function paypalFunction() {
            paypalInstance.tokenize({
                flow: 'checkout', // Required
                intent: 'sale',
                amount: 25.00, // Required
                currency: 'USD', // Required
                locale: 'en_US',
                useraction: 'commit',
                enableShippingAddress: false,
                displayName: "Smithfield"
            }, function (err, tokenizationPayload) {
                const formData = $("form.pp").serializeArray();

                if(err){
                    console.log("Error\n")
                    console.log(err)

                    fetch('/paypal-error', {
                        method: 'POST',
                        body: JSON.stringify({
                            type: 'tokenization error',
                            code: err.code,
                            details: err.details,
                            message: err.message,
                            name: err.name,
                            type: err.type,
                            formData
                        }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    return $.ajax({
                        type: "POST",
                        url: '/committed-cooks-application',
                        data: formData,
                        cache: false,
                        dataType:"json"
                    });
                }
                console.log(tokenizationPayload);

                if (tokenizationPayload && tokenizationPayload.nonce){
                    $.ajax({
                        type: "POST",
                        url: '/committed-cooks-application',
                        data: formData,
                        cache: false,
                        dataType:"json",
                        success: function(data){
                            formData.push({name:"nonce",value: tokenizationPayload.nonce})
                            formData.push({name:"id",value: data.success[0]})
                            //console.log(data)
                            $.ajax({
                                type: "POST",
                                url: '/committed-cooks-payment',
                                data: formData,
                                cache: false,
                                dataType:"json",
                                success: function(data){
                                   console.log(data)
                                   window.location.href = "/committed-cooks-thanks";
                                },
                                done: function(data){
                                  
                                },
                                error:function(error){
                                    alert("There was a problem with your submission, please try again.");
                                    fetch('/paypal-error', {
                                        method: 'POST',
                                        body: JSON.stringify({type: '/committed-cooks-payment', error, formData}),
                                        headers: {
                                            'Content-Type': 'application/json'
                                        }
                                    });
                                    console.log(error)
                                }
                              })
                        },
                        done: function(data){
                          
                        },
                        error:function(error){
                            alert("There was a problem with your submission, please try again.");
                            fetch('/paypal-error', {
                                method: 'POST',
                                body: JSON.stringify({type: '/committed-cooks-application', error, formData}),
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                            console.log(error)
                        }
                    })


                    
                }
                else {
                    hideModal($("#loading"))
                    alert("Please complete the PayPal transaction to complete your submission.");
                }
            })
        }//end paypalfunction
    })//end braintree client create
});//end client
