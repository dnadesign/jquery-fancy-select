/**
 * Fancy Select Plugin. 
 *
 * Converts a <select> field to a clickable text box and triggers a div to appear instead
 * of the dropdown. The div can be positioned as required.
 *
 * Also optionally allows for keyboard entry and filtering of the result set.
 *
 * @version 0.5
 * @author Will Rossiter <will@silverstripe.com>
 */

/**
 * Case insenstive contains. Used for the keyboard filtering of the select
 * we don't want to exclude things that have a not matching case
 */
jQuery.expr[':'].Contains = function(a,i,m) {
    return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
};

(function($) {
	
	$.fn.fancySelect = function(config) {
		/**
		 * Overridable options from your callee. All events will have callbacks
		 * in the format onEvent and onAfterEvent. Mouse events use the mouseenter
		 * and mouseleave format so that behaviour is consistent.
		 */
		config = jQuery.extend({
			containerClass: 'fancy-select',
			resultsClass: 'fancy-select-results',
			placeholderClass: 'fancy-select-replaced',
			itemHoverClass: 'fancy-select-hover',
			selectOpenClass : 'fancy-select-open',
			selectHoverClass: 'fancy-select-hovered',
			allowTextFilter: true,
			
			onItemEnter: function() {
				$(this).addClass(config.itemHoverClass);
			},
			onItemLeave: function() {
				$(this).removeClass(config.itemHoverClass);
			},
			onOptionSelect: function() {
				//
			},
			onSelectOpen: function() {
				$(this).addClass(config.selectOpenClass);
				$(this).siblings(config.getResultsSelector()).show();
			},
			onSelectClose: function() {
				$(this).siblings(config.getResultsSelector()).hide();
				$(this).removeClass(config.selectOpenClass);
			},
			onSelectEnter: function() {
				$(this).addClass(config.selectHoverClass);
			},
			onSelectLeave: function() {
				$(this).removeClass(config.selectHoverClass);
			},
			getResultsSelector: function() {
				return "." + config.resultsClass;
			},
			getPlaceholderSelector: function() {
				return "." + config.placeholderClass;
			},
			getResultsContainer: function() {
				return "<div class='"+ config.resultsClass+"'></div>";
			},
			getPlaceholderContainer: function() {
				return "<div class='"+ config.placeholderClass+"'></div>";
			},
			getContainer: function() {
				return "<div class='"+ config.containerClass+"'></div>";
			}	
		}, config);
	
		/**
		 * Global document click handler
		 *
		 * This is required so that the user does not have the close the select
		 * explictly, clicking elsewhere on the page will close the select
		 */
		$(document).click(function(e) {
			if(!e) {
				var e = window.event;
			}
			// if clicked element is a child of either the container or elements
			if($(e.target).parents(config.getResultsSelector()).length > 0) {
				return;
			}
			
			// if clicked element is the replaced section then ignore it
			if($(e.target).parents(config.getPlaceholderSelector()).length > 0) {
				return;
			}
			
			// close all popups
			$(config.getPlaceholderSelector()).each(function() {
				config.onSelectClose.call(this);
			});
		}).keydown(function(e) {
			// move any of the selects on any of the key presses if they are
			// actively open. There should only actually be one of these windows
			// open at a time
			$(config.getResultsSelector() +":visible").each(function() {
				if(/38|40|13/.test(e.keyCode)) {
				
				if(typeof move !== "undefined") {
					var currentLi = $("li."+config.itemHoverClass, this);	

					if(!currentLi) {
						if(move == 1) {
							// select the first
							$("li:first", this).addClass(config.itemHoverClass);
						}
					
						// do nothing, nothing is selected
						return
					}
					else {
						// return, and selected li so I choose you
						if(move == 0) {
							$(currentLi).click();
							
							return;
						}
						
						// get the index of the current one. Need to
						// work out if we're able to go up
						var list = $("li", this);
						var i = list.index($(currentLi).get(0));
						var pos = i+move;

						if(pos > 0 && pos < list.length) {
							currentLi.removeClass(config.itemHoverClass);
							$("li:eq("+ pos +")	").addClass(config.itemHoverClass);
						}
						
						return;
					}
					
				}
				}
			});
		});
		
		/**
		 * Representation of a replaced selected. Has one constructor argument
		 * required and that is the original select field we're replacing.
		 *
		 * The other configuration comes from the config
		 */
		function FancySelectReplacement(orig) {
			this.select = orig;
			this.container = $(config.getContainer());
			this.results = $(config.getResultsContainer()).css({
				'position': 'absolute',
				'display': 'none'
			});
			
			return this.init();
		}
		
		/**
		 * Replace the built in select with the container and the results
		 */
		FancySelectReplacement.prototype.init = function() {
			var list, selected, placeholder_p, placeholder_i;
			var self = this;
			
			list = $("<ul></ul>");
			
			// convert all options to list items and save the values as data attributes
			this.select.children('option').each(function() {
				list.append(
					$("<li>"+ $(this).text() + "</li>").data("value", $(this).val())
				);
			});
			
			this.results.append(list);

			// Convert the ye old select tag to a simple div and add the classes
			// required change the select form value to a hidden field.
		 	selected = $("option:selected", this.select);
			this.val = $('<input type="hidden" id="'+this.select.id +'" />');
			this.val.name = this.select.attr('name');
			this.val.value = selected.val();
			
			// setup the default place holder.
			// either it will just be a string of text or an input field. The input
			// field allows a user to filter the list but we keep the p there, just
			// do several layers of magic
			placeholder_p = $('<p class="fancy-placeholder"></p>')
				.append(selected.text())
				.data('default', selected.text());
			
			this.placeholder = $(config.getPlaceholderContainer())
				.click(function() {
					// if the related select is open then close them all else close everything apart from
					// the one which is needed
					var hidden = (self.results.is(":hidden"));

					$(config.getPlaceholderSelector()).each(function() {
						config.onSelectClose.call(this);
					});

					if(hidden) {
						config.onSelectOpen.call(this);

						// if we have an input then focus that field so users can type
						if(config.allowTextFilter) {
							self.focus();
						}
					}
				}).hover(function() {
					config.onSelectEnter.call(this);
				}, function() {
					config.onSelectLeave.call(this);
				})
				.append(placeholder_p);
			
			if(config.allowTextFilter) {
				var input = $('<input class="fancy-placeholder fancy-textbox" type="text" />')
					.keydown(function(e) {
						// on keydown we can't test for values, but we can be safely assume and say
						// if any key other than direction and return then there will be input
						if(!(/37|38|39|40|13/.test(e.keyCode))) {
							placeholder_p.text("");
						}
						
						// if the dropdown is hidden (i.e we focused directly to the input) then
						// make sure it is open
						if(results.is(":hidden")) {
							config.onSelectOpen.call(self.placeholder);
						}
					}).keyup(function(e) {
						// strip out any parentheses values from the input
						// as the selector blafs on ()
						var token = $(this).val().replace(/[\(|\)]/gi, '');

						if(token.length < 1) {
							placeholder_p.text(placeholder_p.data('default'));
							$("li", list).show();
						}
						else {

							placeholder_p.text("");
							$("li:not(:Contains("+ token + "))", list)
								.hide()
								.removeClass(config.itemHoverClass);
							
							var winners = $("li:Contains("+ token + ")", list);
							winners.show();
							
							$(":first", winners).addClass(config.itemHoverClass);
						}
					});
					
				input.attr('tabIndex', this.select.tabIndex);
				
				this.placeholder.append(input);
			}
			
			this.container.append(this.placeholder);
			this.container.append(this.results);
			this.container.hide();
			
			this.select.after(this.container);
			this.select.attr('name', this.select.attr('name') + "-fancy-hidden").hide();
			this.container.show();
			
			return this;
		}
	
		/**
		 * Set the passed list item as the selected option in the
		 * dropdrown
		 *
		 * @param string
		 */
		FancySelectReplacement.prototype.setSelectedItem = function(li) {
			this.placeholder.find(".fancy-placeholder").text(li.text());
			this.val.val(li.data('value'));
		}
		
		/**
		 * Focus event to the FancySelect. Should focus the text field
		 * placeholder if enabled.
		 */
		FancySelectReplacement.prototype.focus = function() {
			$(this.placeholder).find("input").focus();
		}
		
		return this.each(function() {
			var select = $(this);
			var replacement = new FancySelectReplacement(select);
			var results = replacement.results;
			
			$("li", results).click(function() {
				replacement.setSelectedItem($(this));

				config.onOptionSelect.call(this);
				config.onSelectClose.call(replacement.placeholder);
				
			}).hover(function() {
				config.onItemEnter.call(this);
				
			}, function() {
				config.onItemLeave.call(this);
				
			});
		});
	}
})(jQuery);