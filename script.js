angular.module('Mongo', ['ui.router'])
.constant('ATN', {
  // 'API_URL': 'http://localhost:3000/',
  API_URL: 'https://mongoquestions.herokuapp.com/',
})
.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/");
  $stateProvider
    .state('home', {
      url: "/",
      templateUrl: "list.html",
      controller: 'MainCtrl'
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
.controller('QuestionCtrl', function($scope, Question, $state, Answer){
  $scope.slug = $state.params.slug;

  Question.getOne($state.params.slug)
  .success(function(data) {
    $scope.question = data;
  }).catch(function(err) {
    $state.go('404');
    console.error(err);
  });

  $scope.addAnswer = function(){
    Answer.addAnswer($scope.answer, $scope.slug)
    .success(function(data){
      $scope.question = data;
    }).catch(function(err) {
      console.error(err);
    });
    $scope.answer = {};
  };
})
.controller('MainCtrl', function($scope, $http, Question){
  Question.getAll().success(function(data){
    $scope.questions = data;
  }).catch(function(error){
    console.error(error);
  });
})
.controller('NewQuestionCtrl', function($scope, $state, Question){
  $scope.askQuestion = function(){
    Question.addQuestion($scope.ask)
    .success(function(data){
      $state.go('home');
    })
    .catch(function(data){
      console.error(data);
    });
  };
});
