import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
  private readonly usersService: UsersService,
  private readonly jwtService: JwtService,
) {}

async login(dto: LoginDto) {
  const user = await this.validateCredentials(dto);

  const accessToken = await this.jwtService.signAsync({
    sub: user.id,
  });

  return { accessToken };
}

  async register(dto: RegisterDto) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new BadRequestException(
        'A senha deve ter no máximo 72 bytes em UTF-8',
      );
    }

    

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.usersService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
    });
  }

  async validateCredentials(dto: LoginDto) {
  const user = await this.usersService.findByEmail(dto.email);

  if (!user) {
    throw new UnauthorizedException('Email ou senha inválidos');
  }

  const passwordMatches = await bcrypt.compare(
    dto.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new UnauthorizedException('Email ou senha inválidos');
  }

  return { id: user.id };
}
}