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

(function($) {
	$.fn.fancySelect = function(settings) {
		/**
		 * Overridable options from your callee. All events will have callbacks
		 * in the format onEvent and onAfterEvent. Mouse events use the mouseenter
		 * and mouseleave format so that behaviour is consistent.
		 */
		settings = jQuery.extend({
			resultsClass: 'fancy-select-container',
			placeholderClass: 'fancy-select-replaced',
			itemHoverClass: 'fancy-select-hover',
			selectOpenClass : 'fancy-select-open',
			selectHoverClass: 'fancy-select-hovered',
			
			onItemEnter: function() {
				$(this).addClass(settings.itemHoverClass);
			},
			onItemLeave: function() {
				$(this).removeClass(settings.itemHoverClass);
			},
			onOptionSelect: function() {
				//
			},
			onSelectOpen: function() {
				$(this).addClass(settings.selectOpenClass);
				$(this).siblings(settings.getResultsSelector()).show().focus();
			},
			onSelectClose: function() {
				$(this).siblings(settings.getResultsSelector()).hide();
				$(this).removeClass(settings.selectOpenClass);
			},
			onSelectEnter: function() {
				$(this).addClass(settings.selectHoverClass);
			},
			onSelectLeave: function() {
				$(this).removeClass(settings.selectHoverClass);
			},
			getResultsSelector: function() {
				return "." + settings.resultsClass;
			},
			getPlaceholderSelector: function() {
				return "." + settings.placeholderClass;
			},
			getResultsContainer: function() {
				return "<div class='"+ settings.resultsClass+"'></div>";
			},
			getPlaceholderContainer: function() {
				return "<div class='"+ settings.placeholderClass+"'></div>";
			},			
		}, settings);
	
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
			if($(e.target).parents(settings.getResultsSelector()).length > 0) {
				return;
			}
			
			// if clicked element is the replaced section then ignore it
			if($(e.target).parents(settings.getPlaceholderSelector()).length > 0) {
				return;
			}
			
			// close all popups
			$(settings.getResultsSelector()).each(function() {
				settings.onSelectClose.call(this);
			});
		});
	
		function Replacement(orig) {
			this.select = orig;
			
			// Create a new container to hold the values of the select
			this.results = $(settings.getResultsContainer());
			this.results.css({
				'position': 'absolute',
				'display': 'none',
				'left': this.select.position().left
			});
			
			list = $("<ul></ul>");
			
			// convert all options to list items and save the values as attributes
			// since options can have titles. 
			this.select.children('option').each(function() {
				list.append(
					$("<li>"+ $(this).text() + "</li>").data("value", $(this).val())
				);
			});
			
			this.results.append(list);

			// Convert the ye old select tag to a simple div and add the classes
			// required change the select form value to a hidden field.
		 	var selected = $("option:selected", this.select);
			this.val = $('<input type="hidden" id="'+this.select.id +'" />');
			this.val.name = this.select.attr('name');
			this.val.value = selected.val();
		
			this.placeholder = $(settings.getPlaceholderContainer()).append(
				$('<p class="fancy-placeholder"></p>').append(selected.text())
			);

			this.select.before(this.placeholder);
			this.select.after(this.results);

			this.select.attr('name', this.select.attr('name') + "-fancy-hidden").hide();
			this.placeholder.show();
			
			/**
			 * Setup the mouse events for clicking and selecting the options in the list
			 * also adds hover effects and mouse out events.
			 *
			 * Uses the callback functions defined in the settings to provide the functionality
			 */
			var self = this;
			
			this.placeholder.click(function() {
				// if the related select is open then close them all else close everything apart from
				// the one which is needed
				var open = (self.results.is(":visible")) ? false : true;
				
				$(settings.getResultsSelector()).each(function() {
					settings.onSelectClose.call(this);
				});
				
				if(open) {
					settings.onSelectOpen.call(this);
				}
			}).hover(function() {
				settings.onSelectEnter.call(this);
			}, function() {
				settings.onSelectLeave.call(this);
			});
			
			/**
			 * Set the passed list item as the selected option in the
			 * dropdrown
			 *
			 * @param string
			 */
			this.setSelectedItem = function(li) {
				// set the placeholder text
				self.placeholder.find(".fancy-placeholder").text(li.text());
				
				// set the hidden field title
				self.val.val(li.data('value'));
			}
			
			return this;
		}
		
		return this.each(function() {
			var select = $(this);
			var replacement = new Replacement(select);
			var results = replacement.results;
			
			$("li", results).click(function() {
				replacement.setSelectedItem($(this));

				settings.onOptionSelect.call(this);
				settings.onSelectClose.call(replacement.placeholder);
				
			}).hover(function() {
				settings.onItemEnter.call(this);
				
			}, function() {
				settings.onItemLeave.call(this);
				
			});
		});
	}
})(jQuery);