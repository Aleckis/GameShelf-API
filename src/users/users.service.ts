import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData) {
  try {
    return await this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Email ou nome de usuário já cadastrado',
      );
    }

    throw error;
  }
}

findByEmail(email: string) {
  return this.prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
    },
  });
}
}