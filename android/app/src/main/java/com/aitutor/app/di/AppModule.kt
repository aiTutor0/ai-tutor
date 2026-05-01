package com.aitutor.app.di

import com.aitutor.app.data.local.UserPreferences
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    // UserPreferences uses @Inject constructor + @Singleton, so Hilt provides it
    // automatically. Explicit @Provides shown here for any non-injectable types
    // (e.g. third-party clients) that we'll add in Phase 1+.
    //
    // @Provides @Singleton fun provideSupabaseClient(): SupabaseClient = ...
}
