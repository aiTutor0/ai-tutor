# Kotlinx Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keep,includedescriptorclasses class com.aitutor.app.**$$serializer { *; }
-keepclassmembers class com.aitutor.app.** {
    *** Companion;
}
-keepclasseswithmembers class com.aitutor.app.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Supabase / Ktor
-keep class io.ktor.** { *; }
-keep class io.github.jan.supabase.** { *; }

# WebRTC
-keep class org.webrtc.** { *; }

# Compose
-keep class androidx.compose.** { *; }
