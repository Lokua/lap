(function() { 'use strict';

  angular.module('handler', []).factory('Handler', function() {
    
    function Handler(context) {
      if (!(this instanceof Handler)) {
        return new Handler(context);
      }
      this.context = context || this;
      this.handlers = this.context.handlers = {};
      return this;
    }

    Handler.prototype.on = function(fn, handler) {
      if (this.handlers[fn] === undefined) {
        this.handlers[fn] = [];
      }
      this.handlers[fn].push(handler);
      return this;
    };

    Handler.prototype.register = function(callbacks) {
      if (callbacks !== undefined) {
        for (var h in callbacks) {
          if (callbacks.hasOwnProperty(h)) {
            this.on(h, callbacks[h]);
          }
        }
      }
      return this;
    };


    Handler.prototype.remove = function(fn) {
      if (this.handlers[fn] !== undefined) {
        delete this.handlers[fn];
      }
    };

    Handler.prototype.removeAll = function() {
      this.handlers = {};
    };


    Handler.prototype.trigger = function(fn) {
      var handler = this.handlers[fn] || [],
          i = 0, len = handler.length;
      for (; i < len; i++) {
        handler[i].apply(this.context, []);
      }
      return this;
    };

    return Handler;

  });



})();