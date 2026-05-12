package es.api_idee.builder;

import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import es.api_idee.parameter.Parameters;
import es.api_idee.parameter.PluginAPI;
import es.api_idee.parameter.PluginAPIParam;

public class JSBuilder {

	/**
	 * Generates the code to create a map with the specified parameters
	 * 
	 * @param parameters parameters specified by the user
	 * @param plugins
	 * @param callbackFn the name of the javascript function to execute as callback
	 * @param impl       the implementation to use
	 * 
	 * @return the javascript code
	 */
	public static String build(Parameters parameters, List<String> plugins) {
		return build(parameters, plugins, null, null, null);
	}

	/**
	 * Generates the code to create a map with the specified parameters, controls,
	 * plugins, configuration and layers
	 * 
	 * @param parameters    parameters specified by the user
	 * @param plugins       list of plugins
	 * @param controls      list of controls
	 * @param layers        list of layers
	 * @param configuration JSONObject with IDEE.config assignments
	 * 
	 * @return the javascript code
	 */
	public static String build(Parameters parameters, List<String> plugins, List<String> controls, List<String> layers,
			JSONObject configuration) {
		StringBuilder codeJS = new StringBuilder();

		// Add IDEE.config assignments dynamically
		if (configuration != null && configuration.length() > 0) {
			java.util.Iterator<String> keys = configuration.keys();
			while (keys.hasNext()) {
				String key = keys.next();
				Object value = configuration.get(key);
				codeJS.append("IDEE.config.").append(key).append("=");

				if (value instanceof String) {
					codeJS.append("\"").append(value).append("\"");
				} else if (value instanceof Boolean || value instanceof Number) {
					codeJS.append(value);
				} else if (value instanceof JSONObject || value instanceof JSONArray) {
					codeJS.append(value.toString());
				} else {
					codeJS.append("\"").append(value.toString()).append("\"");
				}

				codeJS.append(";");
			}
		}

		// Build the map params JSON, merging quoted controls/layers into the JSON object.
		// Quoted strings (starting with '"') are GET star-format entries → go inside IDEE.map({}).
		// JS expressions (starting with 'new') are POST-built objects → stay as .addControls()/.addLayers() chains.
		JSONObject paramsJSON = parameters.toJSON();

		List<String> chainControls = new ArrayList<>();
		if (controls != null && !controls.isEmpty()) {
			JSONArray controlsArr = paramsJSON.has("controls")
					? paramsJSON.getJSONArray("controls") : new JSONArray();
			for (String control : controls) {
				if (control.startsWith("\"") && control.endsWith("\"")) {
					controlsArr.put(control.substring(1, control.length() - 1));
				} else {
					chainControls.add(control);
				}
			}
			if (controlsArr.length() > 0) {
				paramsJSON.put("controls", controlsArr);
			}
		}

		List<String> chainLayers = new ArrayList<>();
		if (layers != null && !layers.isEmpty()) {
			JSONArray layersArr = paramsJSON.has("layers")
					? paramsJSON.getJSONArray("layers") : new JSONArray();
			for (String layer : layers) {
				if (layer.startsWith("\"") && layer.endsWith("\"")) {
					layersArr.put(layer.substring(1, layer.length() - 1));
				} else {
					chainLayers.add(layer);
				}
			}
			if (layersArr.length() > 0) {
				paramsJSON.put("layers", layersArr);
			}
		}

		codeJS.append("IDEE.map(").append(paramsJSON).append(")");

		// add plugins with .addPlugin(...)
		if (plugins != null) {
			for (String plugin : plugins) {
				addPlugin(codeJS, plugin);
			}
		}

		// add POST JS-expression controls with .addControls(...)
		for (String control : chainControls) {
			addControls(codeJS, control);
		}

		// add POST JS-expression layers with .addLayers([...])
		if (!chainLayers.isEmpty()) {
			codeJS.append(".addLayers([");
			for (int i = 0; i < chainLayers.size(); i++) {
				if (i > 0) {
					codeJS.append(",");
				}
				codeJS.append(chainLayers.get(i));
			}
			codeJS.append("])");
		}

		wrapCallback(codeJS, parameters.getCallbackFn());

		return codeJS.toString();
	}

	private static void addPlugin(StringBuilder codeJS, String plugin) {
		codeJS.append(".addPlugin(").append(plugin).append(")");
	}

	private static void addControls(StringBuilder codeJS, String control) {
		codeJS.append(".addControls(").append(control).append(")");
	}

	/**
	 * Wraps the javascript code to execute it as parameter of the specified
	 * function
	 * 
	 * @param code       the javascript code to execute it as parameter
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the execution of the callback with the javascript code as parameter
	 */
	public static void wrapCallback(StringBuilder code, String callbackFn) {
		// if no callback function was specified do not wrap the code
		if (!StringUtils.isEmpty(callbackFn)) {
			code.insert(0, "(").insert(0, callbackFn);
			code.append(");");
		}
	}

	/**
	 * Wraps the JSON array to execute it as parameter of the specified function
	 * 
	 * @param jsonArray  the JSON array to execute it as parameter
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the execution of the callback with the JSON array as parameter
	 */
	public static String wrapCallback(JSONArray jsonArray, String callbackFn) {
		return wrapCallback(jsonArray.toString(), callbackFn);
	}

	/**
	 * Wraps the JSON to execute it as parameter of the specified function
	 * 
	 * @param json       the JSON to execute it as parameter
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the execution of the callback with the JSON as parameter
	 */
	public static String wrapCallback(JSONObject json, String callbackFn) {
		return wrapCallback(json.toString(), callbackFn);
	}

	/**
	 * Wraps the javascript code to execute it as parameter of the specified
	 * function
	 * 
	 * @param code       the javascript code to execute it as parameter
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the execution of the callback with the javascript code as parameter
	 */
	public static String wrapCallback(String code, String callbackFn) {
		String wrappedCode = code;
		// if no callback function was specified do not wrap the code
		if (!StringUtils.isEmpty(callbackFn)) {
			StringBuilder wrapBuilder = new StringBuilder();
			wrapBuilder.append(callbackFn).append("(").append(code).append(");");
			wrappedCode = wrapBuilder.toString();
		}
		return wrappedCode;
	}

	public static String createPlugin(PluginAPI plugin) {
		return createPlugin(plugin, (String) null);
	}

	public static String createPlugin(PluginAPI plugin, String paramValue) {
		// New star format: value is "key=val;key=val" — delegate to Map-based approach
		if (!StringUtils.isEmpty(paramValue) && paramValue.matches("\\w+=.*")) {
			Map<String, String> params = new java.util.LinkedHashMap<>();
			for (String pair : paramValue.split(";")) {
				int eqIdx = pair.indexOf('=');
				if (eqIdx > 0) {
					params.put(pair.substring(0, eqIdx).trim(), pair.substring(eqIdx + 1).trim());
				}
			}
			return createPlugin(plugin, params);
		}

		StringBuilder pluginBuilder = new StringBuilder();

		String[] paramValues = null;
		String separator = plugin.getSeparator();
		if (!StringUtils.isEmpty(paramValue) && (separator != null)) {
			paramValues = paramValue.split(separator);
		} else if (!StringUtils.isEmpty(paramValue)) {
			paramValues = new String[1];
			paramValues[0] = paramValue;
		}

		pluginBuilder.append("new ").append(plugin.getConstructor());
		pluginBuilder.append("(");
		
		boolean founded = false;
		int index = 0;
		if (paramValues != null) {
			int i = 0;
			while (!founded && i < paramValues.length) {
				if (paramValues[i].contains("base64=")) {
					founded = true;
					index = i;
				}
				i++;
			}
		}

		if (founded) {
			String base64 = paramValues[index].replace("base64=", "");
			byte[] decodedBytes = Base64.getDecoder().decode(base64);
			String decoded = new String(decodedBytes);
			JSONObject decodedJSON = new JSONObject(decoded); 
			pluginBuilder.append(decodedJSON);
		} else {
			List<PluginAPIParam> pluginAPIParams = plugin.getParameters();
			if (pluginAPIParams != null) {
				for (int i = 0; i < pluginAPIParams.size(); i++) {
					PluginAPIParam pluginAPIParam = pluginAPIParams.get(i);
					pluginBuilder.append(readPluginParameter(pluginAPIParam, paramValues));
					if (i < (pluginAPIParams.size() - 1)) {
						pluginBuilder.append(",");
					}
				}
			}
		}

		pluginBuilder.append(")");

		return pluginBuilder.toString();
	}

	private static Object readPluginParameter(PluginAPIParam pluginAPIParam, String[] paramValues) {
		Object pluginParam = null;

		int position = pluginAPIParam.getPosition();
		String value = pluginAPIParam.getValue();
		List<PluginAPIParam> properties = pluginAPIParam.getProperties();

		String type = pluginAPIParam.getType();
		if (type.equalsIgnoreCase(PluginAPIParam.OBJECT)) {
			pluginParam = new JSONObject();
			if (properties != null) {
				for (PluginAPIParam property : properties) {
					Object propertyValue = readPluginParameter(property, paramValues);
					if (propertyValue != null) {
						if (property.getType().equals(PluginAPIParam.NUMBER)) {
							String val = propertyValue.toString();
							if(!val.equals("")) {
							((JSONObject) pluginParam).put(property.getName(),
									Double.parseDouble(val));
							}
						} else if (property.getType().equals(PluginAPIParam.BOOLEAN)) {
							((JSONObject) pluginParam).put(property.getName(),
									Boolean.parseBoolean(propertyValue.toString()));
						} else {
							((JSONObject) pluginParam).put(property.getName(), propertyValue);
						}

					}
				}
			}
		} else if (type.equalsIgnoreCase(PluginAPIParam.ARRAY)) {
			pluginParam = new JSONArray();
			if (properties != null) {
				for (int i = 0; i < properties.size(); i++) {
					PluginAPIParam property = properties.get(i);
					Object elementValue = readPluginParameter(property, paramValues);
					if (elementValue != null) {
						((JSONArray) pluginParam).put(elementValue);
					}
				}
			}
		} else if (type.equalsIgnoreCase(PluginAPIParam.SIMPLE)) {
			if (value != null) {
				pluginParam = value;
			} else if ((position != -1) && (paramValues != null) && (paramValues.length > position)) {
				pluginParam = paramValues[position];
			}
		} else if (type.equalsIgnoreCase(PluginAPIParam.NUMBER)) {
			if (value != null) {
				pluginParam = value;
			} else if ((position != -1) && (paramValues != null) && (paramValues.length > position)) {
				pluginParam = paramValues[position];
			}
		} else if (type.equalsIgnoreCase(PluginAPIParam.BOOLEAN)) {
			if (value != null) {
				pluginParam = value;
			} else if ((position != -1) && (paramValues != null) && (paramValues.length > position)) {
				pluginParam = paramValues[position];
			}
		}

		return pluginParam;
	}

	/**
	 * Creates a plugin using OpenAPI key=value style parameters.
	 * Example URL: ?layerswitcher.position=BL&layerswitcher.collapsed=true
	 *
	 * @param plugin       the plugin API definition
	 * @param keyValueParams map of paramName->value extracted from URL
	 * @return plugin instantiation code
	 */
	public static String createPlugin(PluginAPI plugin, Map<String, String> keyValueParams) {
		StringBuilder pluginBuilder = new StringBuilder();
		pluginBuilder.append("new ").append(plugin.getConstructor()).append("(");

		if (keyValueParams != null && !keyValueParams.isEmpty()) {
			Map<String, String> paramTypes = getParamTypes(plugin);
			JSONObject paramsObj = new JSONObject();

			for (Map.Entry<String, String> entry : keyValueParams.entrySet()) {
				String paramName = entry.getKey();
				String paramValue = entry.getValue();
				String paramType = paramTypes.containsKey(paramName) ? paramTypes.get(paramName) : null;

				if (paramType != null && paramType.equalsIgnoreCase(PluginAPIParam.BOOLEAN)) {
					paramsObj.put(paramName, Boolean.parseBoolean(paramValue));
				} else if (paramType != null && paramType.equalsIgnoreCase(PluginAPIParam.NUMBER)) {
					try {
						paramsObj.put(paramName, Double.parseDouble(paramValue));
					} catch (NumberFormatException e) {
						paramsObj.put(paramName, paramValue);
					}
				} else if (paramType != null && paramType.equalsIgnoreCase(PluginAPIParam.ARRAY)) {
					paramsObj.put(paramName, parseArrayValue(paramValue));
				} else {
					// Type unknown from API definition: use heuristic inference
					inferAndPutValue(paramsObj, paramName, paramValue);
				}
			}

			pluginBuilder.append(paramsObj.toString());
		}

		pluginBuilder.append(")");
		return pluginBuilder.toString();
	}

	/**
	 * Returns a quoted star-format string so client-side buildLayer() resolves and instantiates the layer.
	 *
	 * @param layerEntry star-format string (e.g. "WMTS*url=http://...;name=MTN")
	 * @return quoted JS string for client-side buildLayer()
	 */
	public static String createLayerWithParams(String layerEntry) {
		return "\"" + layerEntry.trim().replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
	}

	/**
	 * Builds a JS control instantiation from a star-format entry.
	 *
	 * Format: "controlName*key=val;key=val"
	 * Example: "timeline*order=2;paramsDate=yr"
	 *
	 * Returns a quoted string so client-side buildControl() resolves the class name,
	 * which owns the control name→class mapping via ControlClass.NAME constants.
	 *
	 * @param controlEntry star-format string (e.g. "timeline*order=2;collapsed=false")
	 * @return quoted JS string for client-side buildControl()
	 */
	public static String createControlWithParams(String controlEntry) {
		return "\"" + controlEntry.trim().replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
	}

	/**
	 * Puts a value into a JSONObject using heuristic type inference:
	 *   "true"/"false"       → boolean
	 *   numeric string       → double
	 *   "[a, b, c]"          → JSONArray  (brackets optional)
	 *   "{\"k\":\"v\"}"      → JSONObject (inline JSON)
	 *   anything else        → string
	 */
	private static void inferAndPutValue(JSONObject obj, String key, String value) {
		String trimmed = value.trim();
		if ("true".equalsIgnoreCase(trimmed) || "false".equalsIgnoreCase(trimmed)) {
			obj.put(key, Boolean.parseBoolean(trimmed));
		} else if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
			try {
				obj.put(key, new JSONObject(trimmed));
			} catch (Exception e) {
				obj.put(key, value);
			}
		} else if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			obj.put(key, parseArrayValue(trimmed));
		} else {
			try {
				if (trimmed.matches("-?\\d+")) {
					obj.put(key, Integer.parseInt(trimmed));
				} else {
					obj.put(key, Double.parseDouble(trimmed));
				}
			} catch (NumberFormatException e) {
				obj.put(key, value);
			}
		}
	}

	/**
	 * Parses a comma-separated array value, with or without surrounding brackets.
	 * Handles: [legend,style,delete] | legend,style,delete | ["a","b"] | [1,2,3]
	 * Each element is trimmed and surrounding quotes are stripped.
	 */
	private static JSONArray parseArrayValue(String value) {
		String trimmed = value.trim();
		if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			trimmed = trimmed.substring(1, trimmed.length() - 1);
		}
		JSONArray arr = new JSONArray();
		for (String element : trimmed.split(",")) {
			String el = element.trim();
			// Strip surrounding quotes if present
			if (el.length() >= 2
					&& ((el.startsWith("\"") && el.endsWith("\""))
					|| (el.startsWith("'") && el.endsWith("'")))) {
				el = el.substring(1, el.length() - 1);
			}
			if ("true".equalsIgnoreCase(el) || "false".equalsIgnoreCase(el)) {
				arr.put(Boolean.parseBoolean(el));
			} else {
				try {
					arr.put(Double.parseDouble(el));
				} catch (NumberFormatException e) {
					arr.put(el);
				}
			}
		}
		return arr;
	}

	/**
	 * Builds a flat map of paramName -> paramType from a plugin's API definition.
	 * Recurses into OBJECT-type parameters to extract their properties.
	 */
	private static Map<String, String> getParamTypes(PluginAPI plugin) {
		Map<String, String> types = new HashMap<>();
		List<PluginAPIParam> params = plugin.getParameters();
		if (params != null) {
			for (PluginAPIParam param : params) {
				if (PluginAPIParam.OBJECT.equalsIgnoreCase(param.getType())) {
					List<PluginAPIParam> properties = param.getProperties();
					if (properties != null) {
						for (PluginAPIParam prop : properties) {
							if (prop.getName() != null) {
								types.put(prop.getName(), prop.getType());
							}
						}
					}
				} else if (param.getName() != null) {
					types.put(param.getName(), param.getType());
				}
			}
		}
		return types;
	}

	/**
	 * Creates a plugin from JSON configuration
	 * 
	 * @param pluginJson JSON object with plugin configuration
	 * @return plugin code string
	 */
	public static String createPluginFromJSON(JSONObject pluginJson) {
		StringBuilder pluginBuilder = new StringBuilder();

		String type = pluginJson.optString("type", "");
		JSONObject params = pluginJson.optJSONObject("params");

		pluginBuilder.append("new IDEE.plugin.").append(type).append("(");

		if (params != null) {
			pluginBuilder.append(params.toString());
		} else {
			pluginBuilder.append("{}");
		}

		pluginBuilder.append(")");

		return pluginBuilder.toString();
	}

	/**
	 * Creates a control from JSON configuration
	 * 
	 * @param controlJson JSON object with control configuration
	 * @return control code string
	 */
	public static String createControlFromJSON(JSONObject controlJson) {
		StringBuilder controlBuilder = new StringBuilder();

		String type = controlJson.optString("type", "");
		JSONObject params = controlJson.optJSONObject("params");

		// Capitalize first letter of control type
		String controlClass = type.substring(0, 1).toUpperCase() + type.substring(1);

		controlBuilder.append("new IDEE.control.").append(controlClass).append("(");

		if (params != null) {
			controlBuilder.append(params.toString());
		}

		controlBuilder.append(")");

		return controlBuilder.toString();
	}

	/**
	 * Creates a layer from JSON configuration
	 * 
	 * @param layerJson JSON object with layer configuration
	 * @return layer code string
	 */
	public static String createLayerFromJSON(JSONObject layerJson) {
		StringBuilder layerBuilder = new StringBuilder();

		String type = layerJson.optString("type", "");

		layerBuilder.append("new IDEE.layer.").append(type).append("(");

		if (layerJson.has("source")) {
			Object sourceObj = layerJson.get("source");

			if (sourceObj instanceof String) {
				layerBuilder.append("\"").append(sourceObj).append("\"");
			} else if (sourceObj instanceof JSONObject) {
				JSONObject source = (JSONObject) sourceObj;

				if (source.has("params")) {
					layerBuilder.append(source.getJSONObject("params").toString());
				}

				if (source.has("options")) {
					layerBuilder.append(",").append(source.getJSONObject("options").toString());
				}

				if (source.has("vendorOptions")) {
					JSONObject vendorOptions = source.getJSONObject("vendorOptions");
					layerBuilder.append(",{");

					java.util.Iterator<String> keys = vendorOptions.keys();
					boolean first = true;
					while (keys.hasNext()) {
						String key = keys.next();
						Object value = vendorOptions.get(key);

						if (!first) {
							layerBuilder.append(",");
						}
						first = false;

						layerBuilder.append(key).append(":");

						if (value instanceof String) {
							String strValue = (String) value;
							layerBuilder.append(strValue);
						} else {
							layerBuilder.append(value.toString());
						}
					}

					layerBuilder.append("}");
				}
			}
		}

		layerBuilder.append(")");

		if (layerJson.has("style")) {
			Object styleObj = layerJson.get("style");

			if (styleObj instanceof String) {
				layerBuilder.append(".setStyle(").append(styleObj).append(")");
			} else if (styleObj instanceof JSONObject) {
				JSONObject style = (JSONObject) styleObj;
				String styleType = style.optString("type", "");

				layerBuilder.append(".setStyle(new IDEE.style.").append(styleType).append("(");

				if (style.has("params")) {
					Object paramsObj = style.get("params");
					if (paramsObj instanceof JSONArray) {
						JSONArray paramsArray = (JSONArray) paramsObj;
						layerBuilder.append("[");
						for (int i = 0; i < paramsArray.length(); i++) {
							if (i > 0)
								layerBuilder.append(",");
							Object param = paramsArray.get(i);
							if (param instanceof String) {
								String paramStr = (String) param;
								if (paramStr.startsWith("M.") || paramStr.startsWith("IDEE.")
										|| paramStr.contains("(")) {
									layerBuilder.append(paramStr);
								} else {
									layerBuilder.append("\"").append(paramStr).append("\"");
								}
							} else if (param instanceof JSONArray) {
								layerBuilder.append(param.toString());
							} else {
								layerBuilder.append(param.toString());
							}
						}
						layerBuilder.append("]");
					} else {
						layerBuilder.append(paramsObj.toString());
					}
				}

				layerBuilder.append("))");
			}
		}

		if (layerJson.has("filter")) {
			String filter = layerJson.getString("filter");
			layerBuilder.append(".setFilter(").append(filter).append(")");
		}

		return layerBuilder.toString();
	}
}
