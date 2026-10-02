import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLibraryEntryDto } from './dto/create-library-entry.dto';
import { UpdateLibraryEntryDto } from './dto/update-library-entry.dto';
import { ListLibraryDto } from './dto/list-library.dto';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    { page = 1, limit = 20, status }: ListLibraryDto,
  ) {
    const where = {
      userId,
      ...(status !== undefined ? { status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.libraryEntry.findMany({
        where,
        include: {
          game: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ addedAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.libraryEntry.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(userId: string, dto: CreateLibraryEntryDto) {
    const game = await this.prisma.game.findUnique({
      where: { id: dto.gameId },
      select: { id: true },
    });

    if (!game) {
      throw new NotFoundException('Jogo não encontrado');
    }

    try {
      return await this.prisma.libraryEntry.create({
        data: {
          userId,
          gameId: dto.gameId,
          status: dto.status ?? 'WANT_TO_PLAY',
        },
        include: {
          game: true,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('O jogo já está na sua biblioteca');
      }

      throw error;
    }
  }

  async update(userId: string, gameId: number, dto: UpdateLibraryEntryDto) {
    if (dto.status === null || dto.hoursPlayed === null) {
      throw new BadRequestException(
        'Status e horas jogadas não podem ser null',
      );
    }

    if (dto.status === undefined && dto.hoursPlayed === undefined) {
      throw new BadRequestException('Informe status ou horas jogadas');
    }

    try {
      return await this.prisma.libraryEntry.update({
        where: {
          userId_gameId: {
            userId,
            gameId,
          },
        },
        data: {
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.hoursPlayed !== undefined
            ? { hoursPlayed: dto.hoursPlayed }
            : {}),
        },
        include: {
          game: true,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException('Jogo não encontrado na sua biblioteca');
      }

      throw error;
    }
  }

  async remove(userId: string, gameId: number) {
    try {
      await this.prisma.libraryEntry.delete({
        where: {
          userId_gameId: {
            userId,
            gameId,
          },
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException('Jogo não encontrado na sua biblioteca');
      }

      throw error;
    }
  }
}
