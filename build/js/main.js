angular.module('invoicing', [])

  // The default logo for the invoice
  .constant('DEFAULT_LOGO', 'images/logo.png')

  // The invoice displayed when the user first uses the app
  .constant('DEFAULT_INVOICE', {
    date: '09/07/2021',
    invoice_number: 2010,
    payment_method: 'Cash',
    amount: '',
    customer_info: {
      name: '',
      course: '',
      amnt_words: '',
      by: 'Eduphile Education Consultancy'
    }
  })

  // Service for accessing local storage
  .service('LocalStorage', [function () {

    var Service = {};

    // Returns true if there is a logo stored
    var hasLogo = function () {
      return !!localStorage['logo'];
    };

    // Returns a stored logo (false if none is stored)
    Service.getLogo = function () {
      if (hasLogo()) {
        return localStorage['logo'];
      } else {
        return false;
      }
    };

    Service.setLogo = function (logo) {
      localStorage['logo'] = logo;
    };

    // Checks to see if an invoice is stored
    var hasInvoice = function () {
      return !(localStorage['invoice'] == '' || localStorage['invoice'] == null);
    };

    // Returns a stored invoice (false if none is stored)
    Service.getInvoice = function () {
      if (hasInvoice()) {
        return JSON.parse(localStorage['invoice']);
      } else {
        return false;
      }
    };

    Service.setInvoice = function (invoice) {
      localStorage['invoice'] = JSON.stringify(invoice);
    };

    // Clears a stored logo
    Service.clearLogo = function () {
      localStorage['logo'] = '';
    };

    // Clears a stored invoice
    Service.clearinvoice = function () {
      localStorage['invoice'] = '';
    };

    // Clears all local storage
    Service.clear = function () {
      localStorage['invoice'] = '';
      Service.clearLogo();
    };

    return Service;

  }])

  .service('Currency', [function () {

    var service = {};

    service.all = function () {
      return [
        {
          name: 'British Pound (£)',
          symbol: '£'
        },
        {
          name: 'Canadian Dollar ($)',
          symbol: 'CAD $ '
        },
        {
          name: 'Euro (€)',
          symbol: '€'
        },
        {
          name: 'Indian Rupee (₹)',
          symbol: '₹'
        },
        {
          name: 'Norwegian krone (kr)',
          symbol: 'kr '
        },
        {
          name: 'US Dollar ($)',
          symbol: '$'
        }
      ]
    }

    return service;

  }])

  // Main application controller
  .controller('InvoiceCtrl', ['$scope', '$http', 'DEFAULT_INVOICE', 'DEFAULT_LOGO', 'LocalStorage', 'Currency',
    function ($scope, $http, DEFAULT_INVOICE, DEFAULT_LOGO, LocalStorage, Currency) {

      // Set defaults
      $scope.currencySymbol = '$';
      $scope.logoRemoved = false;
      $scope.printMode = false;
      $scope.form = false;
      $scope.InvoiceList = [];

      (function init() {
        // Attempt to load invoice from local storage
        !function () {
          var firebaseConfig = {
            apiKey: "AIzaSyB9i6Y3HiXq_NNP-w2QgNxTbEgeUSqi2Ok",
            authDomain: "eduphile-invoice.firebaseapp.com",
            projectId: "eduphile-invoice",
            storageBucket: "eduphile-invoice.appspot.com",
            messagingSenderId: "584599878332",
            appId: "1:584599878332:web:78e9634fc3a9f382742eb9",
            databaseURL: "https://eduphile-invoice-default-rtdb.firebaseio.com"
          };
    
          //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    
          //initialize your firebase
          firebase.initializeApp(firebaseConfig);
          var database = firebase.database();
    
          var invoice = LocalStorage.getInvoice();
          $scope.invoice = invoice ? invoice : DEFAULT_INVOICE;
          //create a variable to hold our orders list from firebase
          database.ref("invoices").on("value", (snap) => {
            var totalRecord = snap.numChildren();
            console.log("Total Record : " + totalRecord);
            $scope.InvoiceList = Object.entries(snap.val()).map((item)=>item[1]);
            angular.element(document.querySelector('#invoice-number')).val(totalRecord+2020);
            $scope.invoice.invoice_number = totalRecord+2020;
          });
        }();

        // Set logo to the one from local storage or use default
        !function () {
          var logo = LocalStorage.getLogo();
          $scope.logo = logo ? logo : DEFAULT_LOGO;
        }();
       
        $scope.availableCurrencies = Currency.all();

      })()
      // Adds an item to the invoice's items
      $scope.addItem = function () {
        $scope.invoice.items.push({ qty: 0, cost: 0, description: "" });
      }

      // Toggle's the logo
      $scope.toggleLogo = function (element) {
        $scope.logoRemoved = !$scope.logoRemoved;
        LocalStorage.clearLogo();
      };

      // Triggers the logo chooser click event
      $scope.viewInvoice = function () {
        // angular.element('#imgInp').trigger('click');
        $scope.form = true;
      };
      $scope.newInvoice = function () {
        // angular.element('#imgInp').trigger('click');
        $scope.form = false;
      };
      $scope.printInfo = function () {
        document.getElementsByClassName('infos')[0].classList.add('no-border');
        document.getElementsByClassName('branding')[0].classList.add('no-border');
        const element = document.getElementById("invoice");
        // Choose the element and save the PDF for our user.
        var opt = {
          filename: "cash-receipt.pdf",
          image: { type: "jpeg", quality: 0.98 },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        };
        // New Promise-based usage:
        html2pdf().set(opt).from(element).save();

       
        // html2pdf().from(element).save();
        setTimeout(()=>{
          firebase.database().ref('invoices/').push($scope.invoice);
          document.getElementsByClassName('infos')[0].classList.remove('no-border');
          document.getElementsByClassName('branding')[0].classList.remove('no-border');
          window.location.reload();
        },2000)
      };

      // Remotes an item from the invoice
      $scope.removeItem = function (item) {
        $scope.invoice.items.splice($scope.invoice.items.indexOf(item), 1);
      };

      // Calculates the sub total of the invoice
      $scope.invoiceSubTotal = function () {
        var total = 0.00;
        angular.forEach($scope.invoice.items, function (item, key) {
          total += (item.qty * item.cost);
        });
        return total;
      };

      // Calculates the tax of the invoice
      $scope.calculateTax = function () {
        return (($scope.invoice.tax * $scope.invoiceSubTotal()) / 100);
      };

      // Calculates the grand total of the invoice
      $scope.calculateGrandTotal = function () {
        saveInvoice();
        return $scope.calculateTax() + $scope.invoiceSubTotal();
      };

      // Clears the local storage
      $scope.clearLocalStorage = function () {
        var confirmClear = confirm('Are you sure you would like to clear the invoice?');
        if (confirmClear) {
          LocalStorage.clear();
          setInvoice(DEFAULT_INVOICE);
        }
      };

      // Sets the current invoice to the given one
      var setInvoice = function (invoice) {
        $scope.invoice = invoice;
        saveInvoice();
      };

      // Reads a url
      var readUrl = function (input) {
        if (input.files && input.files[0]) {
          var reader = new FileReader();
          reader.onload = function (e) {
            document.getElementById('company_logo').setAttribute('src', e.target.result);
            LocalStorage.setLogo(e.target.result);
          }
          reader.readAsDataURL(input.files[0]);
        }
      };

      // Saves the invoice in local storage
      var saveInvoice = function () {
        // LocalStorage.setInvoice($scope.invoice);
      };

      // Runs on document.ready
      // angular.element(document).ready(function () {
      //   // Set focus
      //   document.getElementById('invoice-number').focus();

      //   // Changes the logo whenever the input changes
      //   document.getElementById('imgInp').onchange = function () {
      //     readUrl(this);
      //   };
      // });
     

    }])
