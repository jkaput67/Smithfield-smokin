module.exports = function(controller, knex) {
	return async function cacheItems(req, res, next) {
		//re-write this with proper full promise fulfillment
		if (!controller.cacheItems) {
			console.log("caching common items");
			controller.status = [
				["draft", "As Draft"],
				["review", "For Review"],
				["publish", "And Publish"]
			];
			await knex("content_post_types")
				.select("*")
				.then(function(post_types) {
					controller.post_types = post_types;
				});
			await knex("content_post_template")
				.select("*")
				.then(function(post_template) {
					controller.post_templates = post_template;
				});
			await knex("role_types")
				.select("*")
				.then(function(role_types) {
					controller.role_types = role_types;
				});	
			controller.cacheItems = true;
		}
		next();
	};
};
