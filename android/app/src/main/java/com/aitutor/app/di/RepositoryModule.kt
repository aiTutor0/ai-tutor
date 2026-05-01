package com.aitutor.app.di

import com.aitutor.app.data.repository.AuthRepositoryImpl
import com.aitutor.app.data.repository.ChatRepositoryImpl
import com.aitutor.app.data.repository.GroupChatRepositoryImpl
import com.aitutor.app.data.repository.ListeningRepositoryImpl
import com.aitutor.app.data.repository.ReadingRepositoryImpl
import com.aitutor.app.data.repository.ScheduleRepositoryImpl
import com.aitutor.app.data.repository.WritingRepositoryImpl
import com.aitutor.app.domain.repository.AuthRepository
import com.aitutor.app.domain.repository.ChatRepository
import com.aitutor.app.domain.repository.GroupChatRepository
import com.aitutor.app.domain.repository.ListeningRepository
import com.aitutor.app.domain.repository.ReadingRepository
import com.aitutor.app.domain.repository.ScheduleRepository
import com.aitutor.app.domain.repository.WritingRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindReadingRepository(impl: ReadingRepositoryImpl): ReadingRepository

    @Binds
    @Singleton
    abstract fun bindListeningRepository(impl: ListeningRepositoryImpl): ListeningRepository

    @Binds
    @Singleton
    abstract fun bindWritingRepository(impl: WritingRepositoryImpl): WritingRepository

    @Binds
    @Singleton
    abstract fun bindChatRepository(impl: ChatRepositoryImpl): ChatRepository

    @Binds
    @Singleton
    abstract fun bindGroupChatRepository(impl: GroupChatRepositoryImpl): GroupChatRepository

    @Binds
    @Singleton
    abstract fun bindScheduleRepository(impl: ScheduleRepositoryImpl): ScheduleRepository
}
