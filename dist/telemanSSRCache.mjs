var index = (function (_temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$variable = _ref.variable,
      variable = _ref$variable === void 0 ? '__SSR_CACHE__' : _ref$variable,
      _ref$mode = _ref.mode,
      mode = _ref$mode === void 0 ? window[variable] ? 'client' : 'server' : _ref$mode,
      cacheKeyGenerator = _ref.cacheKeyGenerator,
      cacheValidator = _ref.cacheValidator,
      useCacheOnError = _ref.useCacheOnError,
      onServerRendered = _ref.onServerRendered,
      onClientPreloaded = _ref.onClientPreloaded;

  var cache, script, serverIdleTimer, clientIdleTimer;

  if (mode === 'server') {
    if (onClientPreloaded) {
      onClientPreloaded();
    }

    cache = [];
    resetServerIdleTimer();
  } else {
    if (window[variable]) {
      cache = window[variable] = JSON.parse(decodeURI(window[variable]));
    }

    if (onClientPreloaded) {
      if (!cache || !cache.length) {
        onClientPreloaded();
        onClientPreloaded = null;
      } else {
        resetClientIdleTimer();
      }
    }
  }

  function resetServerIdleTimer() {
    clearTimeout(serverIdleTimer);
    serverIdleTimer = setTimeout(function () {
      if (!script) {
        script = document.createElement('script');
        document.body.insertBefore(script, document.body.getElementsByTagName('script')[0] || null);
      }

      script.text = "var " + variable + " = \"" + encodeURI(JSON.stringify(cache)) + "\"";

      if (onServerRendered) {
        onServerRendered();
        onServerRendered = null;
      }
    }, 450);
  }

  function resetClientIdleTimer() {
    clearTimeout(clientIdleTimer);

    if (onClientPreloaded) {
      clientIdleTimer = setTimeout(function () {
        if (onClientPreloaded) {
          onClientPreloaded();
          onClientPreloaded = null;
        }
      }, 450);
    }
  }

  return function (ctx, next) {
    if (!cache || ctx.options.method && ctx.options.method.toUpperCase() !== 'GET') {
      return next();
    }

    var key = cacheKeyGenerator ? cacheKeyGenerator(ctx) : ctx.url;
    var hit = cache.find(function (item) {
      return item.key === key;
    });

    if (mode === 'server') {
      if (hit) {
        return hit.body;
      }

      clearTimeout(serverIdleTimer);
      return next().then(function (body) {
        cache.push({
          key: key,
          body: body
        });
        return body;
      })["finally"](function () {
        resetServerIdleTimer();
      });
    } else {
      resetClientIdleTimer();

      if (!hit) {
        return next()["finally"](function () {
          return resetClientIdleTimer();
        });
      }

      if (cacheValidator ? cacheValidator(ctx) : true) {
        cleanCache();
        return hit.body;
      } else {
        var promise = next();

        if (useCacheOnError) {
          promise = promise["catch"](function (e) {
            if (useCacheOnError === true || useCacheOnError && useCacheOnError.constructor === Function && useCacheOnError(e, hit.body, ctx)) {
              return hit.body;
            } else {
              throw e;
            }
          });
        }

        return promise["finally"](function () {
          cleanCache();
          resetClientIdleTimer();
        });
      }
    }

    function cleanCache() {
      if (!cache) {
        return;
      }

      var i = cache.indexOf(hit);

      if (i === -1) {
        return;
      }

      cache.splice(i, 1);

      if (!cache.length) {
        cache = null;

        if (onClientPreloaded) {
          clearTimeout(clientIdleTimer);
          onClientPreloaded();
          onClientPreloaded = null;
        }
      }
    }
  };
});

export default index;
//# sourceMappingURL=telemanSSRCache.mjs.map
