var App = App || {};
App.Controls = App.Controls || {};

App.Controls.TagInput = function($underlyingInput) {
	var _ = App.DI.get('_');
	var jQuery = App.DI.get('jQuery');
	var promise = App.DI.get('promise');
	var api = App.DI.get('api');
	var tagList = App.DI.get('tagList');

	var KEY_RETURN = 13;
	var KEY_SPACE = 32;
	var KEY_BACKSPACE = 8;
	var tagConfirmKeys = [KEY_RETURN, KEY_SPACE];
	var inputConfirmKeys = [KEY_RETURN];

	var tags = [];
	var options = {
		beforeTagAdded: null,
		beforeTagRemoved: null,
		inputConfirmed: null,
	};

	var $wrapper = jQuery('<div class="tag-input">');
	var $tagList = jQuery('<ul class="tags">');
	var $input = jQuery('<input class="tag-real-input" type="text"/>');
	var $siblings = jQuery('<div class="related-tags"><span>Sibling tags:</span><ul>');
	var $suggestions = jQuery('<div class="related-tags"><span>Suggested tags:</span><ul>');
	init();
	render();
	initAutocomplete();

	function init() {
		if ($underlyingInput.length === 0) {
			throw new Error('Tag input element was not found');
		}
		if ($underlyingInput.length > 1) {
			throw new Error('Cannot set tag input to more than one element at once');
		}
		if ($underlyingInput.attr('data-tagged')) {
			throw new Error('Tag input was already initialized for this element');
		}
		$underlyingInput.attr('data-tagged', true);
	}

	function render() {
		$underlyingInput.hide();
		$wrapper.append($tagList);
		$wrapper.append($input);
		$wrapper.insertAfter($underlyingInput);
		$wrapper.click(function(e) {
			if (e.target.nodeName === 'LI') {
				return;
			}
			e.preventDefault();
			$input.focus();
		});
		$input.attr('placeholder', $underlyingInput.attr('placeholder'));
		$suggestions.insertAfter($wrapper);
		$siblings.insertAfter($wrapper);

		addTagsFromText($underlyingInput.val());
		$underlyingInput.val('');
	}

	function initAutocomplete() {
		var autocomplete = new App.Controls.AutoCompleteInput($input);
		autocomplete.onApply = function(text) {
			addTagsFromText(text);
			$input.val('');
		};
		autocomplete.additionalFilter = function(results) {
			return _.filter(results, function(resultItem) {
				return !_.contains(getTags(), resultItem[0]);
			});
		};
	}

	$input.bind('focus', function(e) {
		$wrapper.addClass('focused');
	});
	$input.bind('blur', function(e) {
		$wrapper.removeClass('focused');
		var tagName = $input.val();
		addTag(tagName);
		$input.val('');
	});

	$input.bind('paste', function(e) {
		e.preventDefault();
		var pastedText;
		if (window.clipboardData) {
			pastedText = window.clipboardData.getData('Text');
		} else {
			pastedText = (e.originalEvent || e).clipboardData.getData('text/plain');
		}

		if (pastedText.length > 200) {
			window.alert('Pasted text is too long.');
			return;
		}

		addTagsFromTextWithoutLast(pastedText);
	});

	$input.bind('keydown', function(e) {
		if (_.contains(inputConfirmKeys, e.which) && !$input.val()) {
			e.preventDefault();
			if (typeof(options.inputConfirmed) !== 'undefined') {
				options.inputConfirmed();
			}
		} else if (_.contains(tagConfirmKeys, e.which)) {
			var tagName = $input.val();
			e.preventDefault();
			$input.val('');
			addTag(tagName);
		} else if (e.which === KEY_BACKSPACE && jQuery(this).val().length === 0) {
			e.preventDefault();
			removeLastTag();
		}
	});

	function addTagsFromText(text) {
		var tagNamesToAdd = text.split(/\s+/);
		_.map(tagNamesToAdd, addTag);
	}

	function addTagsFromTextWithoutLast(text) {
		var tagNamesToAdd = text.split(/\s+/);
		var lastTagName = tagNamesToAdd.pop();
		_.map(tagNamesToAdd, addTag);
		$input.val(lastTagName);
	}

	function addTag(tagName) {
		tagName = tagName.trim();
		if (tagName.length === 0) {
			return;
		}

		if (tagName.length > 64) {
			//showing alert inside keydown event leads to mysterious behaviors
			//in some browsers, hence the timeout
			window.setTimeout(function() {
				window.alert('Tag is too long.');
			}, 10);
			return;
		}

		if (isTaggedWith(tagName)) {
			flashTagRed(tagName);
		} else {
			beforeTagAdded(tagName);
			tags.push(tagName);
			var $elem = createListElement(tagName);
			$tagList.append($elem);
			afterTagAdded(tagName);
		}
	}

	function beforeTagAdded(tagName) {
		if (typeof(options.beforeTagAdded) === 'function') {
			options.beforeTagAdded(tagName);
		}
	}

	function afterTagAdded(tagName) {
		var tag = getExportedTag(tagName);
		if (tag) {
			_.each(tag.implications, function(impliedTagName) {
				addTag(impliedTagName);
				flashTagYellow(impliedTagName);
			});
			showOrHideSuggestions(tag.suggestions);
		}
	}

	function getExportedTag(tagName) {
		return _.first(_.filter(
			tagList.getTags(),
			function(t) {
				return t.name.toLowerCase() === tagName.toLowerCase();
			}));
	}

	function removeTag(tagName) {
		var oldTagNames = getTags();
		var newTagNames = _.without(oldTagNames, tagName);
		if (newTagNames.length !== oldTagNames.length) {
			if (typeof(options.beforeTagRemoved) === 'function') {
				options.beforeTagRemoved(tagName);
			}
			setTags(newTagNames);
		}
	}

	function isTaggedWith(tagName) {
		var tagNames = _.map(getTags(), function(tagName) {
			return tagName.toLowerCase();
		});
		return _.contains(tagNames, tagName.toLowerCase());
	}

	function removeLastTag() {
		removeTag(_.last(getTags()));
	}

	function flashTagRed(tagName) {
		var $elem = getListElement(tagName);
		$elem.css({backgroundColor: 'rgba(255, 200, 200, 1)'});
	}

	function flashTagYellow(tagName) {
		var $elem = getListElement(tagName);
		$elem.css({backgroundColor: 'rgba(255, 255, 200, 1)'});
	}

	function getListElement(tagName) {
		return $tagList.find('li[data-tag="' + tagName.toLowerCase() + '"]');
	}

	function setTags(newTagNames) {
		tags = newTagNames.slice();
		$tagList.empty();
		$underlyingInput.val(newTagNames.join(' '));
		_.each(newTagNames, function(tagName) {
			var $elem = createListElement(tagName);
			$tagList.append($elem);
		});
	}

	function createListElement(tagName) {
		var $elem = jQuery('<li/>');
		$elem.attr('data-tag', tagName.toLowerCase());

		var $tagLink = jQuery('<a class="tag">');
		$tagLink.text(tagName);
		$tagLink.click(function(e) {
			e.preventDefault();
			showOrHideTagSiblings(tagName);
		});
		$elem.append($tagLink);

		var $deleteButton = jQuery('<a class="close"><i class="fa fa-remove"></i></a>');
		$deleteButton.click(function(e) {
			e.preventDefault();
			removeTag(tagName);
			$input.focus();
		});
		$elem.append($deleteButton);
		return $elem;
	}

	function showOrHideSuggestions(suggestedTagNames) {
		if (_.size(suggestedTagNames) === 0) {
			return;
		}

		var suggestions = filterSuggestions(suggestedTagNames);
		if (suggestions.length > 0) {
			attachTagsToSuggestionList($suggestions.find('ul'), suggestions);
			$suggestions.slideDown('fast');
		}
	}

	function showOrHideTagSiblings(tagName) {
		if ($siblings.data('lastTag') === tagName) {
			$siblings.slideUp('fast');
			$siblings.data('lastTag', null);
			return;
		}

		promise.wait(getSiblings(tagName), promise.make(function(resolve, reject) {
			$siblings.slideUp('fast', resolve);
		})).then(function(siblings) {
			$siblings.data('lastTag', tagName);

			if (!_.size(siblings)) {
				return;
			}

			var suggestions = filterSuggestions(_.pluck(siblings, 'name'));
			if (suggestions.length > 0) {
				attachTagsToSuggestionList($siblings.find('ul'), suggestions);
				$siblings.slideDown('fast');
			}
		});
	}

	function filterSuggestions(sourceTagNames) {
		var tagNames = _.filter(sourceTagNames.slice(), function(tagName) {
			return !isTaggedWith(tagName);
		});
		tagNames = tagNames.slice(0, 20);
		return tagNames;
	}

	function attachTagsToSuggestionList($list, tagNames) {
		$list.empty();
		_.each(tagNames, function(tagName) {
			var $li = jQuery('<li>');
			var $a = jQuery('<a href="#/posts/query=' + tagName + '">');
			$a.text(tagName);
			$a.click(function(e) {
				e.preventDefault();
				addTag(tagName);
				$li.fadeOut('fast', function() {
					$li.remove();
					if ($list.children().length === 0) {
						$list.parent('div').slideUp('fast');
					}
				});
			});
			$li.append($a);
			$list.append($li);
		});
	}

	function getSiblings(tagName) {
		return promise.make(function(resolve, reject) {
			promise.wait(api.get('/tags/' + tagName + '/siblings'))
				.then(function(response) {
					resolve(response.json.data);
				}).fail(function() {
					reject();
				});
		});
	}

	function getTags() {
		return tags;
	}

	function focus() {
		$input.focus();
	}

	_.extend(options, {
		setTags: setTags,
		getTags: getTags,
		removeTag: removeTag,
		addTag: addTag,
		focus: focus,
	});
	return options;
};
