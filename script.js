angular.module('Mongo', ['ui.router'])
.constant('ATN', {
  // 'API_URL': 'http://localhost:3000/',
  API_URL: 'https://mongoquestions.herokuapp.com/',
})
.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/home");
  $stateProvider
    .state('home', {
      url: "/home",
      templateUrl: "list.html",
      controller: 'MainCtrl'
    })
    .state("login", {
      url:"/",
      templateUrl: "login.html",
      controller: "LoginCtrl"
    })
    .state('new', {
      url: "/new",
      templateUrl: "new.html",
      controller: "NewQuestionCtrl"
    })
    .state('404', {
      url: "/404",
      templateUrl: "404.html",
    })
    .state('question', {
      url: "/:slug",
      templateUrl: "question.html",
      controller: "QuestionCtrl"
    });
}).service("Authentication", function($state){
  var ref = new Firebase("https://crackling-torch-2790.firebaseio.com/");
  var activeUser;
  this.loginUser = function(userEmail, userPassword){
    ref.authWithPassword({
      email: userEmail,
      password: userPassword
    }, function(error, userData) {
      if(error){
        console.error("Error logging in:", error);
        activeUser = userEmail;
      } else {
        console.log(userData);
        $state.go("home");
      }
    });
  };
  this.createUser = function(newUserEmail, newUserPassword) {
    ref.createUser({
      email: newUserEmail,
      password: newUserPassword
    }, function(error, userData){
      if (error){
        console.log("Error creating user:", error);
      } else {
        console.log("successfully created user account");
        console.log(userData);
      }
    });
  };
  this.logOut = function() {
    ref.unauth();
    $state.go("login");
    console.log("log out");
  };
  this.onAuth = function() {
    ref.onAuth(function(authData){
      if (authData) {
        console.log("Authenticated with uid:", authData.uid);
        console.log(authData.password.email);
        activeUser = authData.password.email;
      } else {
        console.log("Client unauthenticated.");
        activeUser = null;
      }
    });
  };
  this.user = function(){
    return activeUser;
  };
})
.factory('Question', function($http, ATN){
  return {
    getOne: function(slug){
      return $http.get(ATN.API_URL + 'questions/' + slug);
    },
    getAll: function(){
      return $http.get(ATN.API_URL + 'questions');
    },
    addQuestion: function(newQuestion){
      return $http.post(ATN.API_URL + 'questions', newQuestion);
    },
    // editQuestion: function(slug, update) {
    //   return $http.patch(ATN.API_URL + "/questions/" + slug, update);
    // },
    deleteQuestion: function(slug) {
      return $http.delete(ATN.API_URL + "questions/" + slug);
    }
  };
})
.factory('Answer', function($http, ATN){
  return {
    addAnswer: function(answer, slug){
      return $http.post(ATN.API_URL + 'questions/' + slug + '/answers', answer);
    },
  };
})
.filter('dateInWords', ['$http', function(){
  return function(input){
    return moment(input).utc().fromNow();
  };
}])
.controller('QuestionCtrl', function($scope, Question, $state, Answer, Authentication){
  $scope.slug = $state.params.slug;
  $scope.email = Authentication.user();
  Question.getOne($state.params.slug)
  .success(function(data) {
    $scope.question = data;
  }).catch(function(err) {
    $state.go('404');
    console.error(err);
  });

  $scope.addAnswer = function(){
    $scope.answer.email = Authentication.user();
    Answer.addAnswer($scope.answer, $scope.slug)
    .success(function(data){
      $scope.question = data;
    }).catch(function(err) {
      console.error(err);
    });
    $scope.answer = {};
  };
  $scope.deleteQuestion = function(){
    Question.deleteQuestion($scope.slug);
  };
})
.controller('MainCtrl', function($scope, $http, Question, Authentication){
  Authentication.onAuth();
  Question.getAll().success(function(data){
    $scope.questions = data;
  }).catch(function(error){
    console.error(error);
  });
  $scope.logOff = function(){
    Authentication.logOut();
    Authentication.activeUser = null;
  };
})
.controller('NewQuestionCtrl', function($scope, $state, Question, Authentication){
  $scope.askQuestion = function(){
    console.log(Authentication.user());
    $scope.ask.email = Authentication.user();
    Question.addQuestion($scope.ask)
    .success(function(data){
      $state.go('home');
    })
    .catch(function(data){
      console.error(data);
    });
  };
})
.controller("LoginCtrl", function($scope, Authentication){
  $scope.login = function() {
    Authentication.loginUser($scope.user.email, $scope.user.password);
  };
  $scope.createUser = function() {
    Authentication.createUser($scope.newUser.email, $scope.newUser.password);
  };
});
