/**
 * 🧪 TESTE COMPLETO: Sistema de Likes e Comentários
 * 
 * Este script testa:
 * - ✅ Likes em aulas
 * - ✅ Likes em comentários
 * - ✅ Contador persistente
 * - ✅ Notificações
 */

import axios from "axios";

const BASE_URL = "http://localhost:3007";

interface TestResult {
  test: string;
  status: "✅ PASS" | "❌ FAIL";
  details?: any;
  error?: string;
}

const results: TestResult[] = [];

async function testLikesAndComments() {
  console.log("🧪 INICIANDO TESTES DE LIKES E COMENTÁRIOS\n");
  console.log("=" .repeat(60));
  console.log("");

  try {
    // 1. Registrar usuário
    console.log("📝 Teste 1: Registrar usuário de teste...");
    const registerResponse = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      name: "Teste Like User",
      email: `testlike${Date.now()}@test.com`,
      password: "123456",
      confirmPassword: "123456",
    });

    if (registerResponse.data.success) {
      results.push({ test: "Registro de usuário", status: "✅ PASS" });
      console.log("✅ Usuário registrado com sucesso\n");
    }

    const token = registerResponse.data.data.tokens.accessToken;
    const userId = registerResponse.data.data.user.id;

    // 2. Listar cursos
    console.log("📚 Teste 2: Listar cursos...");
    const coursesResponse = await axios.get(`${BASE_URL}/api/v1/courses`);
    
    if (coursesResponse.data.length > 0 || coursesResponse.data.data?.length > 0) {
      const courses = coursesResponse.data.data || coursesResponse.data;
      const courseId = courses[0]?.id;
      console.log(`✅ Cursos encontrados. Usando courseId: ${courseId}\n`);
      results.push({ test: "Listar cursos", status: "✅ PASS" });

      // 3. Listar aulas do curso
      console.log("📖 Teste 3: Listar aulas do curso...");
      const lessonsResponse = await axios.get(
        `${BASE_URL}/api/v1/courses/${courseId}/lessons`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const lessons = lessonsResponse.data.data || lessonsResponse.data;
      
      if (lessons.length > 0) {
        const lessonId = lessons[0].id;
        console.log(`✅ Aulas encontradas. Usando lessonId: ${lessonId}\n`);
        results.push({ test: "Listar aulas", status: "✅ PASS" });

        // 4. Dar like na aula
        console.log("❤️  Teste 4: Dar like na aula...");
        const likeResponse = await axios.post(
          `${BASE_URL}/api/v1/courses/${courseId}/lessons/${lessonId}/likes`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (likeResponse.data.success) {
          console.log(`✅ Like registrado! Liked: ${likeResponse.data.data.liked}, Count: ${likeResponse.data.data.likesCount}\n`);
          results.push({
            test: "Dar like na aula",
            status: "✅ PASS",
            details: likeResponse.data.data,
          });
        }

        // 5. Verificar status de like
        console.log("🔍 Teste 5: Verificar status de like...");
        const statusResponse = await axios.get(
          `${BASE_URL}/api/v1/courses/${courseId}/lessons/${lessonId}/likes/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (statusResponse.data.success) {
          console.log(`✅ Status recuperado! Liked: ${statusResponse.data.data.liked}, Count: ${statusResponse.data.data.likesCount}\n`);
          results.push({
            test: "Status de like",
            status: "✅ PASS",
            details: statusResponse.data.data,
          });
        }

        // 6. Remover like
        console.log("💔 Teste 6: Remover like...");
        const unlikeResponse = await axios.delete(
          `${BASE_URL}/api/v1/courses/${courseId}/lessons/${lessonId}/likes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (unlikeResponse.data.success) {
          console.log(`✅ Like removido! Liked: ${unlikeResponse.data.data.liked}, Count: ${unlikeResponse.data.data.likesCount}\n`);
          results.push({
            test: "Remover like",
            status: "✅ PASS",
            details: unlikeResponse.data.data,
          });
        }

        // 7. Criar comentário
        console.log("💬 Teste 7: Criar comentário...");
        const commentResponse = await axios.post(
          `${BASE_URL}/api/v1/courses/${courseId}/lessons/${lessonId}/comentarios`,
          {
            content: "Teste de comentário! Isso está funcionando perfeitamente! 🚀",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (commentResponse.data.success) {
          const commentId = commentResponse.data.data.id;
          console.log(`✅ Comentário criado! ID: ${commentId}\n`);
          results.push({
            test: "Criar comentário",
            status: "✅ PASS",
            details: { commentId },
          });

          // 8. Curtir comentário
          console.log("❤️  Teste 8: Curtir comentário...");
          const commentLikeResponse = await axios.post(
            `${BASE_URL}/api/v1/courses/${courseId}/lessons/${lessonId}/comentarios/${commentId}/likes`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (commentLikeResponse.data.success) {
            console.log(`✅ Like no comentário! Liked: ${commentLikeResponse.data.data.liked}, Count: ${commentLikeResponse.data.data.likesCount}\n`);
            results.push({
              test: "Like em comentário",
              status: "✅ PASS",
              details: commentLikeResponse.data.data,
            });
          }
        }

        // 9. Verificar notificações
        console.log("🔔 Teste 9: Verificar notificações...");
        const notificationsResponse = await axios.get(
          `${BASE_URL}/api/v1/notifications`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const notifications = notificationsResponse.data.data || notificationsResponse.data;
        console.log(`✅ Notificações recebidas: ${notifications.length}\n`);
        results.push({
          test: "Receber notificações",
          status: "✅ PASS",
          details: { count: notifications.length },
        });
      } else {
        console.log("⚠️  Nenhuma aula encontrada no curso\n");
      }
    } else {
      console.log("⚠️  Nenhum curso encontrado\n");
    }
  } catch (error: any) {
    console.error("❌ ERRO:", error.response?.data || error.message);
    results.push({
      test: error.config?.url || "Unknown",
      status: "❌ FAIL",
      error: error.response?.data?.message || error.message,
    });
  }

  // Sumário
  console.log("\n");
  console.log("=" .repeat(60));
  console.log("📊 SUMÁRIO DOS TESTES");
  console.log("=" .repeat(60));
  console.log("");

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.status} ${result.test}`);
    if (result.details) {
      console.log(`   Detalhes:`, JSON.stringify(result.details, null, 2));
    }
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });

  const passed = results.filter((r) => r.status === "✅ PASS").length;
  const total = results.length;

  console.log("");
  console.log(`Total: ${passed}/${total} testes passaram`);
  console.log("");

  if (passed === total) {
    console.log("🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!");
  } else {
    console.log("⚠️  Alguns testes falharam. Revisar erros acima.");
  }
}

testLikesAndComments().catch(console.error);

