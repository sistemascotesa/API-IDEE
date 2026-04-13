package es.api_idee.api;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import javax.servlet.ServletContext;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.UriInfo;

import org.json.JSONArray;
import org.json.JSONObject;

import es.api_idee.builder.JSBuilder;
import es.api_idee.parameter.Parameters;
import es.api_idee.parameter.parser.ParametersParser;
import es.api_idee.plugins.PluginsManager;

@Produces("application/javascript; charset=UTF-8")
@Path("/")
public class BuilderWS {

   @Context
   private ServletContext context;
   
   /**
    * Provides the code to build a map using the Javascript
    * API through GET method
    * 
    * @param callbackFn the name of the javascript
    * function to execute as callback
    * 
    * @return the javascript code
    */
   @GET
   @Path("/js")
   @Produces("text/plain; charset=UTF-8")
   public String js(@Context UriInfo uriInfo) {
      MultivaluedMap<String, String> queryParams = uriInfo.getQueryParameters();

      Parameters parameters = ParametersParser.parse(queryParams);
      
      // plugins
      PluginsManager.init(context);
      List<String> plugins = PluginsManager.getPlugins(queryParams);

      // New OpenAPI key=value style controls: controls.{controlName}.{paramName}=value
      List<String> controls = detectKeyValueControls(queryParams);

      // New OpenAPI key=value style layers: layers.{index}.type=WMTS&layers.{index}.url=...
      List<String> layers = detectKeyValueLayers(queryParams);

      String codeJS = JSBuilder.build(parameters, plugins,
            controls.isEmpty() ? null : controls,
            layers.isEmpty() ? null : layers,
            null);

      return codeJS;
   }

   /**
    * Provides the code to build a map using the Javascript
    * API through POST method
    * 
    * @param jsonBody the JSON body with the configuration
    * 
    * @return the javascript code
    */
   @POST
   @Path("/js")
   @Consumes("application/json")
   @Produces("text/plain; charset=UTF-8")
   public String jsPost(@Context UriInfo uriInfo, String jsonBody) {
      try {
         // Parse JSON body
         JSONObject json = new JSONObject(jsonBody);

         // Parse map parameters
         Parameters parameters = ParametersParser.parseFromJSON(jsonBody);
         // Ensure container defaults to "map" when no map config is present in the body
         if (parameters.toJSON().optString("container", "").isEmpty()) {
            parameters.addContainer("map");
         }

         // Parse plugins
         List<String> plugins = new ArrayList<>();
         if (json.has("plugins")) {
            JSONArray pluginsArray = json.getJSONArray("plugins");
            for (int i = 0; i < pluginsArray.length(); i++) {
               JSONObject pluginJson = pluginsArray.getJSONObject(i);
               String pluginCode = JSBuilder.createPluginFromJSON(pluginJson);
               plugins.add(pluginCode);
            }
         }

         // Parse controls
         List<String> controls = new ArrayList<>();
         if (json.has("controls")) {
            JSONArray controlsArray = json.getJSONArray("controls");
            for (int i = 0; i < controlsArray.length(); i++) {
               JSONObject controlJson = controlsArray.getJSONObject(i);
               String controlCode = JSBuilder.createControlFromJSON(controlJson);
               controls.add(controlCode);
            }
         }

         // Parse layers
         List<String> layers = new ArrayList<>();
         if (json.has("layers")) {
            JSONArray layersArray = json.getJSONArray("layers");
            for (int i = 0; i < layersArray.length(); i++) {
               JSONObject layerJson = layersArray.getJSONObject(i);
               String layerCode = JSBuilder.createLayerFromJSON(layerJson);
               layers.add(layerCode);
            }
         }

         // Parse configuration for IDEE.config assignments
         JSONObject configuration = null;
         if (json.has("configuration")) {
            configuration = json.getJSONObject("configuration");
         }

         String codeJS = JSBuilder.build(parameters, plugins, controls, layers, configuration);

         return codeJS;
      } catch (Exception e) {
         e.printStackTrace();
         return "// Error processing JSON: " + e.getMessage();
      }
   }

   /**
    * Detects new OpenAPI key=value style layer parameters and returns a list of
    * layer instantiation strings.
    *
    * Format: layers.{index}.{paramName}=value
    * The "type" param is mandatory and defines the layer class.
    *
    * Example:
    *   layers.0.type=WMTS&layers.0.url=http://...&layers.0.name=MTN&layers.0.matrixSet=GoogleMapsCompatible
    *   -> new IDEE.layer.WMTS({"url":"http://...","name":"MTN","matrixSet":"GoogleMapsCompatible"})
    *
    * Layers are ordered by index (alphabetical/numeric sort of the index token).
    * The existing ?layers=WMTS*... format still works independently.
    */
   private List<String> detectKeyValueLayers(MultivaluedMap<String, String> queryParams) {
      // TreeMap keeps indices in sorted order (0, 1, 2, ...; or "a", "b", ...)
      Map<String, Map<String, String>> layerParams = new TreeMap<>();
      for (String paramName : queryParams.keySet()) {
         if (!paramName.startsWith("layers.")) continue;
         String rest = paramName.substring("layers.".length()); // e.g. "0.type" or "0.url"
         int dotIndex = rest.indexOf('.');
         if (dotIndex <= 0) continue; // bare layers.something with no param — skip
         String layerIndex = rest.substring(0, dotIndex);
         String param = rest.substring(dotIndex + 1);
         if (!layerParams.containsKey(layerIndex)) {
            layerParams.put(layerIndex, new LinkedHashMap<String, String>());
         }
         String value = queryParams.getFirst(paramName);
         if (value != null) {
            layerParams.get(layerIndex).put(param, value);
         }
      }
      List<String> layers = new ArrayList<>();
      for (Map.Entry<String, Map<String, String>> entry : layerParams.entrySet()) {
         Map<String, String> params = new LinkedHashMap<>(entry.getValue());
         String layerType = params.remove("type");
         if (layerType != null && !layerType.isEmpty()) {
            layers.add(JSBuilder.createLayerWithParams(layerType, params));
         }
      }
      return layers;
   }

   /**
    * Detects new OpenAPI key=value style control parameters and returns a list of
    * control instantiation strings.
    *
    * Supported formats:
    *   controls.scale                    -> new IDEE.control.Scale()
    *   controls.scale.exactScale=false   -> new IDEE.control.Scale({"exactScale":false})
    *
    * Multiple params for the same control are merged:
    *   controls.scale.exactScale=false&controls.scale.units=m
    *   -> new IDEE.control.Scale({"exactScale":false,"units":"m"})
    */
   private List<String> detectKeyValueControls(MultivaluedMap<String, String> queryParams) {
      Map<String, Map<String, String>> controlParams = new LinkedHashMap<>();
      for (String paramName : queryParams.keySet()) {
         if (!paramName.startsWith("controls.")) continue;
         String rest = paramName.substring("controls.".length()); // e.g. "scale" or "scale.exactScale"
         int dotIndex = rest.indexOf('.');
         if (dotIndex <= 0) {
            // Format: controls.{controlName}  — no sub-params, just register the control
            if (!controlParams.containsKey(rest)) {
               controlParams.put(rest, new LinkedHashMap<String, String>());
            }
         } else {
            // Format: controls.{controlName}.{paramName}=value
            String controlName = rest.substring(0, dotIndex);
            String param = rest.substring(dotIndex + 1);
            if (!controlParams.containsKey(controlName)) {
               controlParams.put(controlName, new LinkedHashMap<String, String>());
            }
            String value = queryParams.getFirst(paramName);
            if (value != null) {
               controlParams.get(controlName).put(param, value);
            }
         }
      }
      List<String> controls = new ArrayList<>();
      for (Map.Entry<String, Map<String, String>> entry : controlParams.entrySet()) {
         controls.add(JSBuilder.createControlWithParams(entry.getKey(), entry.getValue()));
      }
      return controls;
   }
}
