/*
 * Copyright (C) 2011,2012 Callista Enterprise AB <info@callistaenterprise.se>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

_.templateSettings.variable = "us";
_.templateSettings = {
	  interpolate : /\{\{(.+?)\}\}/g // use mustache style delimiters for underscorejs template  
};

$(document).ready(function() {
	//Initialize all date pickers
	$('.dateInput').each(function(i, v) {
		
		var opts = {
			dateFormat : 'yy-mm-dd',
			firstDay : 1
		}
		
		if ( $(this).hasClass('allow-previous') ) {
			
		} else {
			opts.minDate = +0;
		}
		
		$(v).datepicker(opts);
		
	});
});

NC = {		
	log : function(msg) {
		console.log(msg);
	},
	
	getContextPath : function() {
		return GLOB_CTX_PATH;
	},

	focusGained : function(inputField) {
		$(inputField).css('background', '#D9EDF7');
		$(inputField).select();		
	},

	focusLost : function(inputField) {
		$(inputField).css('background', 'white');
	},
	
	GLOBAL : (function() {
		var my = {};
		
		my.showLoader = function(elemId, msg) {
			NC.log('Showing loader for ' + elemId);
			$(elemId).find('.sectionLoader').find('.loaderMessage').html(msg);
			$(elemId).find('.sectionLoader').slideDown('fast');
		};
		
		my.suspendLoader = function(elemId, msg) {
			NC.log('Suspending loader for ' + elemId);
			$(elemId).find('.sectionLoader').slideUp('fast');
		};
		
		my.flash = function(something) {
			something.animate({
				'backgroundColor' : '#eee'
			}, 100).animate({
				'backgroundColor' : 'white'
			}, 200);
		};
		
		my.formatCrn = function(crn) {
			var first = crn.substring(0, 8);
			var last = crn.substring(8, 12);
			
			return first + '-' + last;
		};
		
		return my;
	})(),
	
	PAGINATION : (function() {
		
		var _itemIdPrefix;
		var _current_page;
		var _numberToShow;
		var _data;
		var _index;
		
		var _paginationId;
		var _previousLabel;
		var _nextLabel;
		
		var _onPrevClick;
		var _onNextClick;
		var _onItemClick;
		
		var _count;
		var _pages;
		
		var _paginationPrefix;
		
		var my = {};
		
		var createControl = function() {
			$(_paginationId + ' > ul').append(
				_.template( $('#paginationItem').html() )({
					'prefix' : _paginationPrefix.split('#')[1],
					'page' : 'previous',
					'text' : _previousLabel
				})
			);
			
			for (var i = 0; i < _pages; i++) {
				$(_paginationId + ' > ul').append(
					_.template( $('#paginationItem').html() )({
						'prefix' : _paginationPrefix.split('#')[1],
						'page' : i+1,
						'text' : i+1
					})
				);
			}
			
			$(_paginationId + ' > ul').append(
				_.template( $('#paginationItem').html() )({
					'prefix' : _paginationPrefix.split('#')[1],
					'page' : 'next',
					'text' : _nextLabel
				})
			);
			
			$(_paginationId + ' > ul > li').click(function(e) {
				e.preventDefault();
				
				var text = $(this).prop('id');
				text = text.substr((text.lastIndexOf('-') + 1), text.length);
				
				if (text == "next") {
					nextPage();
					return;
				}
				
				if (text == "previous") {
					previousPage();
					return;
				}
				
				showPage(parseInt(text));
			});
		};
		
		var showPage = function(pageNum) {
			
			hideAll();
			$('li[id^="' + _paginationPrefix.split('#')[1] + '"]').removeClass('disabled');
			
			var dispArr = _index[pageNum - 1];
			NC.log('Show page: ' + (pageNum - 1));
			
			$.each(dispArr, function(i, v) {
				NC.log('Show item ' + _itemIdPrefix + v.id);
				$('#' + _itemIdPrefix + v.id).show();
			});
			
			_current_page = pageNum;
			
			$(_paginationPrefix + '-' + pageNum).addClass('disabled');
			if (pageNum == 1) {
				$(_paginationPrefix + '-previous').addClass('disabled');
			}
			
			if (pageNum == _pages) {
				$(_paginationPrefix + '-next').addClass('disabled');
			}
		};
		
		var nextPage = function() {
			if (_current_page == _pages) {
				throw new Error('Invalid pagination state. Next button should be disabled');
			}
			
			showPage(_current_page + 1);
		};
		
		var previousPage = function() {
			if (_current_page == 1) {
				throw new Error('Invalid pagination state. Previous button should be disabled');
			}
			
			showPage(_current_page - 1);
		}
		
		var hideAll = function() {
			$('[id*="' + _itemIdPrefix + '"]').hide();
		};
		
		my.init = function(params) {
			var that = this;
			this.params = params;
			
			_numberToShow = 5;
			_current_page = 0;
			_itemIdPrefix = params.itemIdPrefix;
			_paginationId = params.paginationId;
			_previousLabel = params.previousLabel;
			_nextLabel = params.nextLabel;
			
			_count = params.data.length;
			_pages = Math.ceil(_count / _numberToShow);
			
			_paginationPrefix = '#pi-pag-' + Math.floor(1000 + Math.random() * 1000);
			
			// Clear any existing pagination
			$(_paginationId + ' ul').empty();
			
			// Index our stuff
			_index = new Array();
			for (var i = 0; i < _pages; i++) {
				_index[i] = new Array();
				
				var startAt = i * _numberToShow;
				for (var j = 0; j < _numberToShow; j++) {
					var rowData = params.data[(startAt + j)];
					if (rowData != undefined) {
						_index[i].push(rowData);
					}
				}
			}
			
			hideAll();
			
			createControl();
			
			if (_pages <= 1) {
				$(_paginationId).hide();
			} else {
				$(_paginationId).show();
			}
			
			showPage(1);
		};
		
		return my;
	})()
};