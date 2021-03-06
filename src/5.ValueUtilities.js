var ValueUtilities = (function () {
	
	function getAssertionValue(value, model){
		var c = value.charCodeAt(0);
		if (c === 34 || c === 39) /* ' || " */{
			return value.substring(1, value.length - 1);
		} else if (c === 45 || (c > 47 && c < 58)) /* [=] || [number] */{
			return value << 0;
		} else {
			return Helper.getProperty(model, value);
		}
		return '';
	}

	var parseLinearCondition = function (line) {
			var cond = {
					assertions: []
				},
				buffer = {
					data: line.replace(regexpWhitespace, '')
				},
				match, expr;

			buffer.index = buffer.data.indexOf('?');

			if (buffer.index === -1) {
				console.error('Invalid Linear Condition: "?" is not found');
			}


			expr = buffer.data.substring(0, buffer.index);

			while ((match = regexpLinearCondition.exec(expr)) != null) {
				cond.assertions.push({
					join: match[4],
					left: match[1],
					sign: match[2],
					right: match[3]
				});
			}

			buffer.index++;
			parseCase(buffer, cond, 'case1');

			buffer.index++;
			parseCase(buffer, cond, 'case2');

			return cond;
		},
		parseCase = function (buffer, obj, key) {
			var c = buffer.data[buffer.index],
				end = null;

			if (c == null) {
				return;
			}
			if (c === '"' || c === "'") {
				end = buffer.data.indexOf(c, ++buffer.index);
				obj[key] = buffer.data.substring(buffer.index, end);
			} else {
				end = buffer.data.indexOf(':', buffer.index);
				if (end === -1) {
					end = buffer.data.length;
				}
				obj[key] = {
					value: buffer.data.substring(buffer.index, end)
				};
			}
			if (end != null) {
				buffer.index = ++end;
			}
		},
		isCondition = function (con, values) {
			if (typeof con === 'string') {
				con = parseLinearCondition(con);
			}
			var current = false,
				a,
				value1,
				value2,
				i,
				length;

			for (i = 0, length = con.assertions.length; i < length; i++) {
				a = con.assertions[i];
				if (a.right == null) {

					current = a.left.charCodeAt(0) === 33 ? !Helper.getProperty(values, a.left.substring(1)) : !!Helper.getProperty(values, a.left);

					if (current === true) {
						if (a.join === '&&') {
							continue;
						}
						break;
					}
					if (a.join === '||') {
						continue;
					}
					break;
				}

				value1 = getAssertionValue(a.left,values);
				value2 = getAssertionValue(a.right,values);
				switch (a.sign) {
					case '<':
						current = value1 < value2;
						break;
					case '<=':
						current = value1 <= value2;
						break;
					case '>':
						current = value1 > value2;
						break;
					case '>=':
						current = value1 >= value2;
						break;
					case '!=':
						current = value1 !== value2;
						break;
					case '==':
						current = value1 === value2;
						break;
				}

				if (current === true) {
					if (a.join === '&&') {
						continue;
					}
					break;
				}
				if (a.join === '||') {
					continue;
				}
				break;
			}
			return current;
		};

	return {
		condition: function (line, values) {
			var con = parseLinearCondition(line),
				result = isCondition(con, values) ? con.case1 : con.case2;

			if (result == null) {
				return '';
			}
			if (typeof result === 'string') {
				return result;
			}
			return Helper.getProperty(values, result.value);
		},
		out: {
			isCondition: isCondition,
			parse: parseLinearCondition
		}
	};
}());

