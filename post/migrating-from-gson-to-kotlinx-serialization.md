Recently, I was working on some improvements for my launcher app, **Text Launcher**. While updating dependencies and cleaning up old code, I realized that the logic used for exporting and importing launcher settings had become unnecessarily verbose. This was especially true when relying on `JsonSerializer` in Gson.

# Use Case

Before diving into the implementation details, let me explain the context. In my launcher app, users can add apps to the home screen or app list, organize them into folders, and also change settings such as background and content colors or show hidden apps.

Now imagine switching to a new Android device would you want to recreate all your folders, place apps one by one, and reapply your settings from scratch? Definitely not. To solve this, I implemented an export/import feature that generates a JSON file representing the full configuration. This file can later be imported to restore everything.

Sure, cloud storage (like Firebase or Supabase) could make this process automatic. But in the interest of simplicity and privacy, I’ve designed this app to work entirely offline, using only the minimal required permissions.

# Solution

The app makes use of several `data` classes, which are also used as Room entities. Many of these hold nested or a bit complex data structures. To serialize and deserialize them using Gson, a custom `JsonSerializer` is needed.

Let's look at the code.

## App data class

This data class represents an installed app, along with its current state (e.g. `InFolder`, `Home`, `Hidden`, or `Favorite`).

```kotlin

@Entity(tableName = "apps")
data class App(
    val name: String,

    @SerializedName("package_name")
    @PrimaryKey
    val packageName: String,

    val state: AppState,
) {
    // helper methods ...
}
        
```

## AppState

As shown below, `AppState` is a sealed class. Since the `App` class includes a property of this sealed type, Gson doesn't support serializing/deserializing it out-of-the-box.

```kotlin

sealed class AppState {
    data object List : AppState()
    data object Favorite : AppState()
    data class Home(val order: Int) : AppState()
    data object Hidden : AppState()
    data object InFolder : AppState()

    fun getTrailingImageVector(): ImageVector? {
        return when (this) {
            is Favorite -> Icons.Filled.Star
            is Home -> null
            else -> Icons.Filled.MoreVert
        }
    }
}
  
```

## Direct conversion with Gson

Object to JSON

```kotlin

val gson = Gson()
val app = App(
    name = "YouTube",
    packageName = "com.google.android.youtube",
    state = AppState.Favorite
)
val jsonString = gson.toJson(app)

  
```

Json to Object

```kotlin

val jsonInput = """
{
  "name": "YouTube",
  "package_name": "com.google.android.youtube",
  "state": {
    "type": "Favorite"
  }
}
"""
val appObj = gson.fromJson(jsonInput, App::class.java)
  
```

Gson doesn’t inherently understand sealed classes or their structure. To resolve this, we must define a custom `JsonSerializer` and `JsonDeserializer`. Also, since these objects are stored in Room, we need to provide proper `TypeConverters`.

```kotlin

import androidx.room.TypeConverter
import com.google.gson.GsonBuilder
import com.google.gson.reflect.TypeToken

class AppListConverter {
    private val gson = GsonBuilder()
        .registerTypeAdapter(AppState::class.java, AppStateJsonSerializer())
        .create()

    @TypeConverter
    fun fromAppList(apps: List< App>?): String? {
        return gson.toJson(apps)
    }

    @TypeConverter
    fun toAppList(appJson: String?): List< App>? {
        if (appJson.isNullOrEmpty()) return emptyList()
        val type = object : TypeToken<List<App>>() {}.type
        return gson.fromJson(appJson, type)
    }
}

import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonSerializationContext
import com.google.gson.JsonSerializer
import java.lang.reflect.Type

class AppStateJsonSerializer : JsonSerializer<AppState>, JsonDeserializer<AppState> {
    override fun serialize(
        src: AppState,
        typeOfSrc: Type,
        context: JsonSerializationContext
    ): JsonElement {
        val jsonObject = JsonObject()
        when (src) {
            is AppState.List -> jsonObject.addProperty("type", "List")
            is AppState.Favorite -> jsonObject.addProperty("type", "Favorite")
            is AppState.Home -> {
                jsonObject.addProperty("type", "Home")
                jsonObject.addProperty("order", src.order)
            }
            is AppState.Hidden -> jsonObject.addProperty("type", "Hidden")
            is AppState.InFolder -> jsonObject.addProperty("type", "InFolder")
        }
        return jsonObject
    }

    override fun deserialize(
        json: JsonElement,
        typeOfT: Type,
        context: JsonDeserializationContext
    ): AppState {
        val jsonObject = json.asJsonObject
        val typeElement = jsonObject.get("type")

        if (typeElement == null || typeElement.isJsonNull) {
            return AppState.List
        }

        return when (typeElement.asString) {
            "List" -> AppState.List
            "Favorite" -> AppState.Favorite
            "Home" -> {
                val orderElement = jsonObject.get("order")
                if (orderElement != null && !orderElement.isJsonNull) {
                    AppState.Home(orderElement.asInt)
                } else {
                    AppState.Home(0)
                }
            }
            "Hidden" -> AppState.Hidden
            "InFolder" -> AppState.InFolder
            else -> AppState.List
        }
    }
}
  
```

While this setup works, it introduces unnecessary complexity. Writing custom serializers/deserializers for every sealed class quickly becomes tedious and error-prone in my project.

# A Better Way is Kotlin Serialization

First of all, Gson is primarily a Java-based solution. It's not optimized for Android development. Gson uses a reflection-based approach and it has issues with tools like ProGuard or R8, which are often used during release builds to shrink, optimize, and obfuscate the app.

Well, it's basically that Gson doesn't know ahead of time what fields your class has. So at runtime, it inspects the class to find all its fields and methods, reads the field names and types, then converts them to JSON.

Kotlinx Serialization solves these problems by generating serialization code at compile time. This eliminates the need for reflection entirely. It understands your data structures ahead of time and creates efficient, optimized code for both serialization and deserialization. This approach is faster, safer, and works seamlessly with sealed classes.

With Kotlinx Serialization, all I need to do is add the `@Serializable` annotation to my data classes, no more writing custom serializers!

```kotlin

import androidx.room.TypeConverter
import kotlinx.serialization.json.Json

class AppListConverter {
    @TypeConverter
    fun fromAppList(apps: List<App>?): String? {
        return apps?.let { Json.encodeToString(it) }
    }

    @TypeConverter
    fun toAppList(appJson: String?): List<App>? {
        return appJson?.let { Json.decodeFromString<List<App>>(it) } ?: emptyList()
    }
}

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "apps")
data class App(
    val name: String,

    @SerialName("package_name")
    @PrimaryKey
    val packageName: String,

    val state: AppState,
) {
    // Helper methods ...
}

@Serializable
sealed class AppState {
    @Serializable
    @SerialName("List")
    data object List : AppState()

    @Serializable
    @SerialName("Favorite")
    data object Favorite : AppState()

    @Serializable
    @SerialName("Home")
    data class Home(val order: Int) : AppState()

    @Serializable
    @SerialName("Hidden")
    data object Hidden : AppState()

    @Serializable
    @SerialName("InFolder")
    data object InFolder : AppState()

    fun getTrailingImageVector(): ImageVector? {
        return when (this) {
            is Favorite -> Icons.Filled.Star
            is Home -> null
            else -> Icons.Filled.MoreVert
        }
    }
}
  
```

# Conclusion

While Gson’s reflection based serialization works for simple use cases, it incurs runtime overhead, fragile obfuscation behavior, and requires custom adapters for Kotlin specific constructs. You can use Kotlinx Serialization or Moshi instead of Gson, which would be a better approach for Android development.
