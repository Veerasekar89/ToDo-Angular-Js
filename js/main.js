var ctsapp = angular.module('ctrlshift', []);
var limit_char_word = 30;

/**
 * The main controller for the app. 
 * retrieves and persists the data via the LocalStorage service
 * exposes the model to the template and provides event handlers
 */
ctsapp.controller('FormController', function($scope, LocalStorage, $timeout) {

	//$scope.popup = false;
	// Fetch the lists records in the localstorage.
	LocalStorage.get();
	$scope.lists = LocalStorage.lists; // Asign the lists data to current object

	$scope.perviousData = null;
	$scope.popup = false;

	// Only allowed alpha numeric charecters (1-9, a-z, A-Z)
	var regex = new RegExp("^[a-zA-Z0-9\\-\\s]+$");
	// This function should be call on keypress/keydown 
	$scope.alphaNumeric = function($event){
		var key = String.fromCharCode(!$event.charCode ? $event.which : $event.charCode);
		if (!regex.test(key)) {
			// Prevent the event regex not matched 
			$event.preventDefault();
			return false;
		}

	}

	// Submit handler for add entry form
	// Send new data to storage, validation and santise the data
	$scope.store = function() {
		if (!$scope.name) { // Validate the title(Should not be empty)
			return;
		}
		//Get current timestamp
		var current_date = new Date();
		var data = {
			name: $scope.name,
			desc: $scope.desc,
			selected: false,
			created_date: current_date,
			updated_date: current_date
		};
		$scope.name = '';
		$scope.desc = '';
		// Call saniise function for remove extra spaces and trim the words
		$scope.sanitize(data);
		// Send data to localstorage service
		LocalStorage.save(data);
		// Show success message in popup 
		$scope.enablePopup('Success', 'Sucessfully added..!');
	};
	
	//Double click handler for inline edit
	$scope.editData = function(data){
		$scope.editedData = data;
		// Temporarily store data before editing .
		$scope.oldData = angular.extend({}, data);
	}
	
	// Cancel the inline edit
	$scope.cancelEdit = function(data){
		// Get data from temporarily storage
		$scope.lists[$scope.lists.indexOf(data)] = $scope.oldData;
		//Reset inline form to content
		$scope.editedData = null;
		$scope.oldData = null;
	}
	
	// Submit handler for add entry form
	// Send new data to storage, validation and santise the data
	$scope.saveEdit = function(data){
		if (!data.name) { // Validate the title(Should not be empty)
			return;
		}
		//Get current timestamp for updated date
		var current_date = new Date();
		data.updated_date =current_date;
		// Call saniise function for remove extra spaces and trim the words
		$scope.sanitize(data);
		// Update data in localstorage service
		LocalStorage.store();
		//Reset inline form to content
		$scope.editedData = null;
		$scope.oldData = null;
		// Show success message in popup 
		$scope.enablePopup('Success', 'Sucessfully updated..!');

	}
	
	//Deletd a entry from lists and localstorage
	$scope.deleteData = function(data){
		if(data.selected){// Only user can delete a entry once marked
			// Delete from lists and localstorage service
			LocalStorage.delete(data);
			// Show success message in popup 
			$scope.enablePopup('Success', 'Deleted Sucessfully..!');

		}else{
			$scope.enablePopup('Error', 'Please check the box and delete.');
		}
	}
	
	// Storing marked entry to localstorage service
	$scope.dataSelected = function(data, selected){
		data.selected = selected;
		
		LocalStorage.store();
	}
	
	// Sanitise the body text 
	$scope.sanitize = function(data){

		// Remove extra spaces between the words
		console.log(data.desc);
		data.name = data.name.replace(/\s\s+/g, ' ');
		var desc = data.desc.replace(/\s\s+/g, ' ');

		//Split the descritopn and store it in array
		var all_words = desc.split(' ');
		var sanitise_word = [];

		// Iterate all words and trim the first 30 characters
		all_words.forEach(function(word) {
			if(word.length>limit_char_word){
				sanitise_word.push(word.substring(0, limit_char_word));
			}else{
				sanitise_word.push(word);
			}
		});

		//Join all the words
		data.desc = sanitise_word.join(' ');
		console.log(data.desc);
	}

	// Monitor the current object for getting total count.
	$scope.$watch('lists', function () {
		$scope.totalCount = $scope.lists.length;
	}, true);

	// Warning/error popup 
	$scope.enablePopup = function(status, msg){
		// Popup with appropriate message. 
		$scope.message = msg;
		$scope.status = status;
		$scope.popup = true;

		// Delete popup automaticlly in 3 seconds
		$timeout(function () {
			$scope.disblePopup();
		}, 3000, true);

	}

	// Warning/error popup delete
	$scope.disblePopup = function(){
		$scope.popup = false;
	}
});

/**
 * Services that persists and retrieves lists from localStorage
 * Returning promises for all changes to the model.
 */
ctsapp.factory('LocalStorage', function() {
	var STORAGE_ID = 'ctrlshft'; //Refernce key for localStorage
    var storage = {

		lists: [], // Kept all entries in this array

		_getFromLocalStorage: function(){
			// Get the data from localStorage
			// Parse json to array  
			return JSON.parse(localStorage.getItem(STORAGE_ID) || '[]');
		},

		save: function(data) {
			// Pushed to lists array
			storage.lists.push(data);
			//Save to local storage
			storage.store();
		},
		
		delete: function(data){
			storage.lists.splice(storage.lists.indexOf(data), 1);
			storage.store();
		},
		
		store : function(){
			// Convert array to json and store in localStorage
			localStorage.setItem(STORAGE_ID, JSON.stringify(storage.lists));
		},
		
		get: function () {
			// Fetch the lists records in the localstorage.
			angular.copy(storage._getFromLocalStorage(), storage.lists);
		},
    };
	
	return storage;
});

/**
 * Directive that places focus on the element it is applied to when the
 * expression it binds to evaluates to true
 */

ctsapp.directive('inlineEdit', function ($timeout) {
	
	return  function (scope, elem, attrs) {
		// Monitor the scope object for inline edit.
		scope.$watch(attrs.inlineEdit, function (value) {
			if(value){
				console.log(elem);
				$timeout(function () {
					// Focus the current elemet
					elem[0].focus();
				}, 0, false);
			}

		});
		
	};
});

/**
 * Directive that executes an expression when the element it is applied to gets
 * an `escape` keydown event.
 */

ctsapp.directive('inlineEscape', function () {
	var ESCAPE_KEY = 27;
	
	return function (scope, elem, attrs) {
		elem.bind('keydown', function (event) {
			if (event.keyCode === ESCAPE_KEY) {
				scope.$apply(attrs.inlineEscape);
			}
		});

		scope.$on('$destroy', function () {
			elem.unbind('keydown');
		});
	};
});
