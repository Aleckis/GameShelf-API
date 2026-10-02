import 'reflect-metadata';
import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../src/auth/auth.service';
import type { UsersService } from '../../src/users/users.service';

describe('AuthService', () => {
  it('não emite token para email inexistente', async () => {
    const users = {
      findByEmail: vi.fn().mockResolvedValue(null),
    };

    const jwt = {
      signAsync: vi.fn(),
    };

    const service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
    );

    await expect(
      service.login({
        email: 'inexistente@example.com',
        password: 'SenhaTeste123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('não emite token para senha errada', async () => {
    const passwordHash = await bcrypt.hash('SenhaCorreta123!', 4);

    const users = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 'usuario-1',
        passwordHash,
      }),
    };

    const jwt = {
      signAsync: vi.fn(),
    };

    const service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
    );

    await expect(
      service.login({
        email: 'alexandre@example.com',
        password: 'SenhaErrada123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('salva um hash válido no cadastro, sem repassar a senha', async () => {
  const users = {
    create: vi.fn().mockResolvedValue({
      id: 'usuario-1',
      email: 'alexandre@example.com',
      username: 'alexandre',
    }),
  };

  const service = new AuthService(
    users as unknown as UsersService,
    {} as JwtService,
  );

  const password = 'SenhaTeste123!';

  const result = await service.register({
    email: 'alexandre@example.com',
    username: 'alexandre',
    password,
  });

  expect(users.create).toHaveBeenCalledTimes(1);

  const savedData = users.create.mock.calls[0][0];

  expect(savedData).not.toHaveProperty('password');
  expect(savedData.passwordHash).not.toBe(password);

  await expect(
    bcrypt.compare(password, savedData.passwordHash),
  ).resolves.toBe(true);

  expect(result).not.toHaveProperty('password');
  expect(result).not.toHaveProperty('passwordHash');
});

});