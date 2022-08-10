// Function to check the request validity (req.body not empty, properties count and properties names)
/* Three parameters: 
*  req and res passed from the middleware function to be able to use the request data and send a response
* validProperties: an array containing the valid properties for the request
*/ 
module.exports = requestValidityCheck = async (req, res, validProperties) => {

  // Validating request
  if (Object.keys(req.body).length == 0) {

    // Sends an error if the body is empty
    res.status(400);
    throw new Error("Request body cannot be empty.");

  } else if (Object.keys(req.body).length > validProperties.length) {

    // Sends error if req.body has more properties than the validProperties array
    res.status(422);
    throw new Error(`Request body cannot have more than ${validProperties.length} properties.`);

  } else {

    // Checking if the req.body properties are valid
    for (const property in req.body) {

      // Sends an error if an invalid property is detected in req.body
      if (!validProperties.includes(property)) {

        res.status(422);
        throw new Error(`Invalid property '${property}' in request.`);

      }

    }
  }

}